import { http, HttpResponse } from 'msw';

import { reviewedDocumentSchema } from '@/features/ocr/schemas';
import type { DocumentExtraction, OcrDocument } from '@/features/ocr/types';

import { extractionImage, fakeExtraction, nextId, runtimeRandom, type BusinessStore } from '../db';
import { api, latency, paginate, problem, requireStore, validationProblem } from '../utils';

/** Uploads still being "read", with when they finish and what they will contain. */
const pending = new Map<string, { readyAt: number; extraction: DocumentExtraction }>();

/** Finishes simulated OCR for documents whose time is up. */
function advance(store: BusinessStore) {
  for (const document of store.documents) {
    const job = pending.get(document.id);
    if (document.status !== 'processing' || !job || Date.now() < job.readyAt) continue;
    document.status = 'needs_review';
    document.extraction = job.extraction;
    document.imageUrl ??= extractionImage(job.extraction);
    pending.delete(document.id);
  }
}

export const documentHandlers = [
  http.get(api('/documents'), async ({ request }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    advance(store);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const items = store.documents.filter((document) => !status || document.status === status);
    return HttpResponse.json(paginate(items, url));
  }),

  http.get(api('/documents/:id'), async ({ request, params }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    advance(store);
    const document = store.documents.find((candidate) => candidate.id === params.id);
    return document ? HttpResponse.json(document) : problem(404, 'Document not found', { code: 'NOT_FOUND' });
  }),

  http.post(api('/documents'), async ({ request }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    const file = (await request.formData()).get('file');
    if (!(file instanceof File) || file.size === 0) {
      return problem(422, 'Validation failed', { code: 'VALIDATION_ERROR', errors: { file: ['Choose a photo or PDF'] } });
    }
    const document: OcrDocument = {
      id: nextId('doc'),
      fileName: file.name,
      status: 'processing',
      uploadedAt: new Date().toISOString(),
      // Mock only: the uploaded photo stays in this tab's memory.
      imageUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      extraction: null,
      reviewed: null,
      failureReason: null,
    };
    pending.set(document.id, { readyAt: Date.now() + 2500, extraction: fakeExtraction(runtimeRandom, store.business.currency) });
    store.documents.unshift(document);
    return HttpResponse.json(document, { status: 201 });
  }),

  http.post(api('/documents/:id/confirm'), async ({ request, params }) => {
    await latency();
    const store = requireStore(request);
    if (store instanceof Response) return store;
    const document = store.documents.find((candidate) => candidate.id === params.id);
    if (!document) return problem(404, 'Document not found', { code: 'NOT_FOUND' });
    if (document.status !== 'needs_review') {
      return problem(409, 'Only documents waiting for review can be confirmed.', { code: 'INVALID_STATE' });
    }
    const parsed = reviewedDocumentSchema.safeParse(await request.json());
    if (!parsed.success) return validationProblem(parsed.error.issues);
    document.status = 'confirmed';
    document.reviewed = parsed.data;
    return HttpResponse.json(document);
  }),
];

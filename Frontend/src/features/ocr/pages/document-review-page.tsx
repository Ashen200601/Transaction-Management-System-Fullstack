import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import { MoneyText } from '@/components/common/money-text';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { getErrorMessage, isApiError } from '@/lib/api/errors';
import { formatDate, formatDateTime } from '@/lib/dates';
import { apiFieldErrors, issuesToFieldErrors } from '@/lib/form-errors';
import { toDecimalInput, toMinorUnits } from '@/lib/money';

import { useConfirmDocument, useDocument } from '../api';
import { ConfidenceBadge } from '../components/confidence-badge';
import { DocumentStatusBadge } from '../components/document-status-badge';
import { reviewedDocumentSchema, type ReviewedDocument } from '../schemas';
import type { DocumentExtraction, OcrDocument } from '../types';

const backLink = (
  <Link to="/documents" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3 mb-2' })}>
    <ArrowLeft aria-hidden />
    Documents
  </Link>
);

export function DocumentReviewPage() {
  const { id = '' } = useParams();
  const query = useDocument(id);

  if (query.isPending) return <LoadingState label="Loading document…" />;
  if (query.isError) {
    if (isApiError(query.error) && query.error.status === 404) {
      return (
        <>
          {backLink}
          <EmptyState title="Document not found" />
        </>
      );
    }
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  const document = query.data;
  return (
    <>
      {backLink}
      <PageHeader
        title={document.fileName}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Uploaded {formatDateTime(document.uploadedAt)} <DocumentStatusBadge status={document.status} />
          </span>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="self-start lg:sticky lg:top-20">
          <CardContent>
            {document.imageUrl ? (
              <img src={document.imageUrl} alt={`Scan of ${document.fileName}`} className="w-full rounded-md object-contain" />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No preview available.</p>
            )}
          </CardContent>
        </Card>
        <DocumentBody document={document} />
      </div>
    </>
  );
}

function DocumentBody({ document }: { document: OcrDocument }) {
  if (document.status === 'processing') {
    return <LoadingState label="Reading the receipt… this usually takes a few seconds." />;
  }
  if (document.status === 'failed') {
    return <ErrorState title="We couldn't read this document" error={new Error(document.failureReason ?? 'Try a sharper photo.')} />;
  }
  if (document.status === 'confirmed' && document.reviewed) {
    return <ConfirmedSummary figures={document.reviewed} />;
  }
  return document.extraction ? (
    <ReviewForm documentId={document.id} extraction={document.extraction} />
  ) : (
    <EmptyState title="Nothing was extracted" description="Try uploading a clearer photo." />
  );
}

function ConfirmedSummary({ figures }: { figures: ReviewedDocument }) {
  const { currency } = figures;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{figures.vendorName}</CardTitle>
        <p className="text-sm text-muted-foreground">{formatDate(figures.documentDate, { timeZone: 'UTC' })}</p>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {figures.lines.map((line, index) => (
          <div key={index} className="flex justify-between gap-4">
            <span>
              {line.quantity} × {line.description}
            </span>
            <MoneyText amount={Math.round(line.quantity * line.unitPrice)} currency={currency} />
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-muted-foreground">
          <span>Tax</span>
          <MoneyText amount={figures.tax} currency={currency} />
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <MoneyText amount={figures.total} currency={currency} />
        </div>
      </CardContent>
    </Card>
  );
}

interface LineDraft {
  description: string;
  quantity: string;
  unitPrice: string;
  confidence: { description: number | null; quantity: number | null; unitPrice: number | null };
}

const toNumber = (value: string) => (/^\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : Number.NaN);

function toMinor(value: string) {
  try {
    return toMinorUnits(value.trim());
  } catch {
    return Number.NaN;
  }
}

function ReviewForm({ documentId, extraction }: { documentId: string; extraction: DocumentExtraction }) {
  const confirm = useConfirmDocument(documentId);
  const [vendorName, setVendorName] = useState(extraction.vendorName.value ?? '');
  const [documentDate, setDocumentDate] = useState(extraction.documentDate.value ?? '');
  const [currency, setCurrency] = useState(extraction.currency.value ?? '');
  const [subtotal, setSubtotal] = useState(toDecimalInput(extraction.subtotal.value));
  const [tax, setTax] = useState(toDecimalInput(extraction.tax.value));
  const [total, setTotal] = useState(toDecimalInput(extraction.total.value));
  const [lines, setLines] = useState<LineDraft[]>(() =>
    extraction.lines.map((line) => ({
      description: line.description.value ?? '',
      quantity: line.quantity.value == null ? '' : String(line.quantity.value),
      unitPrice: toDecimalInput(line.unitPrice.value),
      confidence: {
        description: line.description.confidence,
        quantity: line.quantity.confidence,
        unitPrice: line.unitPrice.confidence,
      },
    })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateLine(index: number, change: Partial<LineDraft>) {
    setLines((previous) => previous.map((line, i) => (i === index ? { ...line, ...change } : line)));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = reviewedDocumentSchema.safeParse({
      vendorName,
      documentDate,
      currency,
      subtotal: toMinor(subtotal),
      tax: toMinor(tax),
      total: toMinor(total),
      lines: lines.map((line) => ({
        description: line.description,
        quantity: toNumber(line.quantity),
        unitPrice: toMinor(line.unitPrice),
      })),
    });
    if (!result.success) {
      setErrors(issuesToFieldErrors(result.error.issues));
      return;
    }
    setErrors({});
    confirm.mutate(result.data, {
      onError: (error) => {
        if (isApiError(error)) setErrors(apiFieldErrors(error.fieldErrors));
      },
    });
  }

  const field = (
    label: string,
    key: string,
    confidence: number | null,
    value: string,
    onChange: (value: string) => void,
    inputProps: InputHTMLAttributes<HTMLInputElement> = {},
  ): ReactNode => (
    <FormField label={label} error={errors[key]}>
      {(control) => (
        <div className="flex items-center gap-2">
          <Input {...control} {...inputProps} value={value} onChange={(event) => onChange(event.target.value)} />
          <ConfidenceBadge confidence={confidence} />
        </div>
      )}
    </FormField>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Check the details</CardTitle>
          <p className="text-sm text-muted-foreground">Fields marked “Check this” or “Low confidence” need a closer look.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {field('Supplier', 'vendorName', extraction.vendorName.confidence, vendorName, setVendorName)}
          <div className="grid gap-4 sm:grid-cols-2">
            {field('Date', 'documentDate', extraction.documentDate.confidence, documentDate, setDocumentDate, { type: 'date' })}
            {field('Currency', 'currency', extraction.currency.confidence, currency, setCurrency, { maxLength: 3 })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lines</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {errors.lines && <p className="text-sm text-destructive">{errors.lines}</p>}
          {lines.map((line, index) => (
            <fieldset key={index} className="grid gap-3 rounded-md border border-border p-3">
              <legend className="sr-only">Line {index + 1}</legend>
              {field('Description', `lines.${index}.description`, line.confidence.description, line.description, (value) =>
                updateLine(index, { description: value }),
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {field('Quantity', `lines.${index}.quantity`, line.confidence.quantity, line.quantity, (value) =>
                  updateLine(index, { quantity: value }), { inputMode: 'decimal' },
                )}
                {field('Unit price', `lines.${index}.unitPrice`, line.confidence.unitPrice, line.unitPrice, (value) =>
                  updateLine(index, { unitPrice: value }), { inputMode: 'decimal' },
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="justify-self-start text-destructive"
                onClick={() => setLines((previous) => previous.filter((_, i) => i !== index))}
              >
                <Trash2 aria-hidden />
                Remove line
              </Button>
            </fieldset>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="justify-self-start"
            onClick={() =>
              setLines((previous) => [
                ...previous,
                { description: '', quantity: '1', unitPrice: '', confidence: { description: 1, quantity: 1, unitPrice: 1 } },
              ])
            }
          >
            <Plus aria-hidden />
            Add line
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {field('Subtotal', 'subtotal', extraction.subtotal.confidence, subtotal, setSubtotal, { inputMode: 'decimal' })}
          {field('Tax', 'tax', extraction.tax.confidence, tax, setTax, { inputMode: 'decimal' })}
          {field('Total', 'total', extraction.total.confidence, total, setTotal, { inputMode: 'decimal' })}
        </CardContent>
      </Card>

      {confirm.isError && !(isApiError(confirm.error) && Object.keys(confirm.error.fieldErrors).length > 0) && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(confirm.error)}
        </p>
      )}

      <Button type="submit" className="justify-self-end" disabled={confirm.isPending}>
        {confirm.isPending ? 'Saving…' : 'Confirm figures'}
      </Button>
    </form>
  );
}

import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { PageHeader } from '@/components/common/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api/errors';

import { useUploadDocument } from '../api';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

export function CapturePage() {
  const navigate = useNavigate();
  const upload = useUploadDocument();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function choose(selected: File | undefined) {
    setError(null);
    if (!selected) return setFile(null);
    if (!ACCEPTED.includes(selected.type)) return setError('Use a photo (JPEG, PNG, WebP, HEIC) or a PDF.');
    if (selected.size > MAX_BYTES) return setError('That file is over 10 MB. Try a smaller photo.');
    setFile(selected);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) return setError('Choose a photo or PDF first.');
    upload.mutate(file, { onSuccess: (document) => navigate(`/documents/${document.id}`, { replace: true }) });
  }

  return (
    <>
      <Link to="/documents" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3 mb-2' })}>
        <ArrowLeft aria-hidden />
        Documents
      </Link>
      <PageHeader title="Scan a receipt" description="Take a photo of a supplier receipt or invoice, or upload a PDF." />

      <Card className="max-w-xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:bg-muted/50">
              <Camera aria-hidden className="size-8 text-muted-foreground" />
              <span className="font-medium">{file ? file.name : 'Take a photo or choose a file'}</span>
              <span className="text-xs text-muted-foreground">JPEG, PNG, WebP, HEIC or PDF, up to 10 MB</span>
              <input
                type="file"
                accept={ACCEPTED.join(',')}
                capture="environment"
                className="sr-only"
                onChange={(event) => choose(event.target.files?.[0])}
              />
            </label>

            {previewUrl && (
              <img src={previewUrl} alt="Preview of the selected receipt" className="max-h-80 rounded-md border border-border object-contain" />
            )}

            {(error || upload.isError) && (
              <p role="alert" className="text-sm text-destructive">
                {error ?? getErrorMessage(upload.error)}
              </p>
            )}

            <Button type="submit" disabled={!file || upload.isPending}>
              <Upload aria-hidden />
              {upload.isPending ? 'Uploading…' : 'Upload and read'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

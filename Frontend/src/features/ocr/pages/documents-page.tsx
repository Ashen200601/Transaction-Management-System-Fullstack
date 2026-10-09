import { ScanLine } from 'lucide-react';
import { Link } from 'react-router';

import { MoneyText } from '@/components/common/money-text';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { usePageParam } from '@/hooks/use-page-param';
import { formatDateTime } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { useDocuments } from '../api';
import { DocumentStatusBadge } from '../components/document-status-badge';

const PAGE_SIZE = 20;

const uploadLink = (
  <Link to="/documents/capture" className={buttonVariants()}>
    <ScanLine aria-hidden />
    Scan a receipt
  </Link>
);

export function DocumentsPage() {
  const [page, setPage] = usePageParam();
  const query = useDocuments({ page, pageSize: PAGE_SIZE });

  let content;
  if (query.isPending) {
    content = <LoadingState label="Loading documents…" />;
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (query.data.items.length === 0) {
    content = (
      <EmptyState
        title="No documents yet"
        description="Scan supplier receipts and invoices; we read the figures for you to check."
        action={uploadLink}
      />
    );
  } else {
    content = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Document</TableHeaderCell>
              <TableHeaderCell>Supplier</TableHeaderCell>
              <TableHeaderCell>Uploaded</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Total</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {query.data.items.map((document) => {
              const figures = document.reviewed;
              const extraction = document.extraction;
              const currency = figures?.currency ?? extraction?.currency.value ?? 'USD';
              const total = figures?.total ?? extraction?.total.value ?? null;
              return (
                <TableRow key={document.id}>
                  <TableCell>
                    <Link to={`/documents/${document.id}`} className="font-medium text-primary hover:underline">
                      {document.fileName}
                    </Link>
                  </TableCell>
                  <TableCell>{figures?.vendorName ?? extraction?.vendorName.value ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(document.uploadedAt)}</TableCell>
                  <TableCell>
                    <DocumentStatusBadge status={document.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {total == null ? '—' : <MoneyText amount={total} currency={currency} />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={query.data.totalPages} onPageChange={setPage} />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Documents" description="Supplier receipts and invoices read by OCR." actions={uploadLink} />
      <Card>{content}</Card>
    </>
  );
}

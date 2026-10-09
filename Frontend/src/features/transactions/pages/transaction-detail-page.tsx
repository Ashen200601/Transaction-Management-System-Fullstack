import { ArrowLeft, Ban, Undo2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import { MoneyText } from '@/components/common/money-text';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { useCan } from '@/features/tenancy/tenant-context';
import { isApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/dates';

import { useTransaction, useVoidTransaction } from '../api';
import { TransactionStatusBadge } from '../components/status-badges';
import { VoidTransactionDialog } from '../components/void-dialog';
import { paymentMethodLabel, transactionTypeLabel } from '../labels';

const backLink = (
  <Link to="/transactions" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3 mb-2' })}>
    <ArrowLeft aria-hidden />
    Transactions
  </Link>
);

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export function TransactionDetailPage() {
  const { id = '' } = useParams();
  const query = useTransaction(id);
  const voidMutation = useVoidTransaction(id);
  const canVoid = useCan('transactions:void');
  const canCreate = useCan('transactions:create');
  const [isVoidOpen, setIsVoidOpen] = useState(false);

  if (query.isPending) return <LoadingState label="Loading transaction…" />;

  if (query.isError) {
    if (isApiError(query.error) && query.error.status === 404) {
      return (
        <>
          {backLink}
          <EmptyState title="Transaction not found" description="It may have been removed, or the link is wrong." />
        </>
      );
    }
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  const transaction = query.data;
  const { currency } = transaction;
  const isActive = transaction.status !== 'voided';

  return (
    <>
      {backLink}
      <PageHeader
        title={`Transaction ${transaction.reference}`}
        description={`${transactionTypeLabel(transaction.type)} · ${formatDateTime(transaction.createdAt)}`}
        actions={
          <>
            {canCreate && isActive && transaction.type === 'sale' && (
              <Link to={`/transactions/new?refundOf=${transaction.id}`} className={buttonVariants({ variant: 'outline' })}>
                <Undo2 aria-hidden />
                Refund
              </Link>
            )}
            {canVoid && isActive && (
              <Button variant="outline" onClick={() => setIsVoidOpen(true)}>
                <Ban aria-hidden />
                Void transaction
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-0">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Product</TableHeaderCell>
                  <TableHeaderCell className="text-right">Qty</TableHeaderCell>
                  <TableHeaderCell className="text-right">Unit price</TableHeaderCell>
                  <TableHeaderCell className="text-right">Discount</TableHeaderCell>
                  <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {transaction.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.productName}</TableCell>
                    <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                    <TableCell className="text-right">
                      <MoneyText amount={line.unitPrice} currency={currency} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {line.discount > 0 ? <MoneyText amount={-line.discount} currency={currency} /> : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyText amount={line.lineTotal} currency={currency} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <dl className="ml-auto max-w-xs divide-y divide-border px-4 pt-3 sm:px-5">
              <Detail label="Subtotal">
                <MoneyText amount={transaction.subtotal} currency={currency} />
              </Detail>
              {transaction.discount > 0 && (
                <Detail label="Discounts">
                  <MoneyText amount={-transaction.discount} currency={currency} />
                </Detail>
              )}
              <Detail label="Tax">
                <MoneyText amount={transaction.tax} currency={currency} />
              </Detail>
              <Detail label={transaction.type === 'refund' ? 'Refunded' : 'Total'}>
                <MoneyText amount={transaction.total} currency={currency} className="text-base" />
              </Detail>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <Detail label="Status">
                <TransactionStatusBadge status={transaction.status} />
              </Detail>
              <Detail label="Payment">{paymentMethodLabel(transaction.paymentMethod)}</Detail>
              <Detail label="Customer">{transaction.customerName ?? 'Walk-in customer'}</Detail>
              <Detail label="Recorded by">{transaction.createdBy.name}</Detail>
              {transaction.originalTransactionId && (
                <Detail label="Refund of">
                  <Link to={`/transactions/${transaction.originalTransactionId}`} className="text-primary hover:underline">
                    Original sale
                  </Link>
                </Detail>
              )}
              {transaction.note && <Detail label="Note">{transaction.note}</Detail>}
              {transaction.voidedAt && <Detail label="Voided on">{formatDateTime(transaction.voidedAt)}</Detail>}
              {transaction.voidReason && <Detail label="Void reason">{transaction.voidReason}</Detail>}
            </dl>
          </CardContent>
        </Card>
      </div>

      <VoidTransactionDialog
        open={isVoidOpen}
        onOpenChange={(open) => {
          setIsVoidOpen(open);
          if (!open) voidMutation.reset();
        }}
        reference={transaction.reference}
        isPending={voidMutation.isPending}
        error={voidMutation.error}
        onConfirm={async (reason) => {
          await voidMutation.mutateAsync({ reason });
          setIsVoidOpen(false);
        }}
      />
    </>
  );
}

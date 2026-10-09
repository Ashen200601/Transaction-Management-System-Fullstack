import { Plus, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { MoneyText } from '@/components/common/money-text';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Can } from '@/features/tenancy/components/can';
import { usePageParam } from '@/hooks/use-page-param';
import { useSearchParam } from '@/hooks/use-search-param';
import { formatDateTime } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { useTransactions } from '../api';
import { TransactionStatusBadge } from '../components/status-badges';
import { paymentMethodLabel } from '../labels';
import type { TransactionStatus } from '../types';

const PAGE_SIZE = 20;
const STATUSES: TransactionStatus[] = ['completed', 'pending', 'voided'];
const STATUS_OPTION_LABELS: Record<TransactionStatus, string> = {
  completed: 'Completed',
  pending: 'Pending',
  voided: 'Voided',
};

const newTransactionLink = (
  <Can permission="transactions:create">
    <Link to="/transactions/new" className={buttonVariants()}>
      <Plus aria-hidden />
      New transaction
    </Link>
  </Can>
);

export function TransactionsPage() {
  const [page, setPage] = usePageParam();
  const [searchParams, setSearchParams] = useSearchParams();
  const { input, setInput, search } = useSearchParam('search');
  const statusParam = searchParams.get('status') ?? '';
  const status = (STATUSES as string[]).includes(statusParam) ? (statusParam as TransactionStatus) : '';

  const query = useTransactions({ page, pageSize: PAGE_SIZE, status, search });
  const hasFilters = Boolean(status || search);

  function changeStatus(next: string) {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous);
      if (next) params.set('status', next);
      else params.delete('status');
      params.delete('page');
      return params;
    });
  }

  let content;
  if (query.isPending) {
    content = <LoadingState label="Loading transactions…" />;
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (query.data.items.length === 0) {
    content = hasFilters ? (
      <EmptyState title="No matching transactions" description="Try a different search or status." />
    ) : (
      <EmptyState
        title="No transactions yet"
        description="Sales and refunds you record will appear here."
        action={newTransactionLink}
      />
    );
  } else {
    content = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Reference</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Payment</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Total</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {query.data.items.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="whitespace-nowrap">
                  <Link to={`/transactions/${transaction.id}`} className="font-medium text-primary hover:underline">
                    {transaction.reference}
                  </Link>
                  {transaction.type === 'refund' && (
                    <Badge tone="info" className="ml-2">
                      Refund
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(transaction.createdAt)}
                </TableCell>
                <TableCell>{transaction.customerName ?? 'Walk-in customer'}</TableCell>
                <TableCell>{paymentMethodLabel(transaction.paymentMethod)}</TableCell>
                <TableCell>
                  <TransactionStatusBadge status={transaction.status} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  <MoneyText
                    amount={transaction.type === 'refund' ? -transaction.total : transaction.total}
                    currency={transaction.currency}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} totalPages={query.data.totalPages} onPageChange={setPage} />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Transactions" description="Sales and refunds recorded in this business." actions={newTransactionLink} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search transactions"
              placeholder="Search by reference or customer"
              className="pl-9"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>
          <NativeSelect
            aria-label="Status"
            className="sm:w-48"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_OPTION_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
        </div>
        {content}
      </Card>
    </>
  );
}

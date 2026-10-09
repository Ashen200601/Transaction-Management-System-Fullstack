import { Search } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { usePageParam } from '@/hooks/use-page-param';
import { useSearchParam } from '@/hooks/use-search-param';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { useCustomers } from '../api';

const PAGE_SIZE = 20;

export function CustomersPage() {
  const [page, setPage] = usePageParam();
  const { input, setInput, search } = useSearchParam('search');
  const query = useCustomers({ page, pageSize: PAGE_SIZE, search });

  let content;
  if (query.isPending) {
    content = <LoadingState label="Loading customers…" />;
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (query.data.items.length === 0) {
    content = (
      <EmptyState
        title="No customers found"
        description={search ? 'Try a different name, email or phone number.' : 'Customers you add to sales appear here.'}
      />
    );
  } else {
    content = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>Customer since</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {query.data.items.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email ?? '—'}</TableCell>
                <TableCell className="whitespace-nowrap">{customer.phone ?? '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(customer.createdAt)}</TableCell>
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
      <PageHeader title="Customers" description="People and businesses you sell to." />
      <Card>
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search customers"
              placeholder="Search by name, email or phone"
              className="pl-9"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>
        </div>
        {content}
      </Card>
    </>
  );
}

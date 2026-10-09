import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Can } from '@/features/tenancy/components/can';
import { usePageParam } from '@/hooks/use-page-param';
import { useSearchParam } from '@/hooks/use-search-param';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { useInventory } from '../api';
import { AdjustStockDialog } from '../components/adjust-stock-dialog';
import { STOCK_STATUS_TONES, getStockStatus, stockStatusLabel } from '../stock-status';
import type { InventoryItem, StockStatus } from '../types';

const PAGE_SIZE = 20;
const STATUSES: StockStatus[] = ['low_stock', 'out_of_stock', 'in_stock'];

export function InventoryPage() {
  const [page, setPage] = usePageParam();
  const [searchParams, setSearchParams] = useSearchParams();
  const { input, setInput, search } = useSearchParam('search');
  const statusParam = searchParams.get('status') ?? '';
  const status = (STATUSES as string[]).includes(statusParam) ? (statusParam as StockStatus) : '';
  const query = useInventory({ page, pageSize: PAGE_SIZE, search, status });
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);

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
    content = <LoadingState label="Loading stock levels…" />;
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (query.data.items.length === 0) {
    content = <EmptyState title="No stock to show" description="Try a different search or filter." />;
  } else {
    content = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>SKU</TableHeaderCell>
              <TableHeaderCell className="text-right">On hand</TableHeaderCell>
              <TableHeaderCell className="text-right">Reorder level</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Updated</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Actions</span>
              </TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {query.data.items.map((item) => {
              const stockStatus = getStockStatus(item.onHand, item.reorderLevel);
              return (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{item.onHand}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{item.reorderLevel}</TableCell>
                  <TableCell>
                    <Badge tone={STOCK_STATUS_TONES[stockStatus]}>{stockStatusLabel(stockStatus)}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(item.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Can permission="inventory:adjust">
                      <Button variant="ghost" size="sm" onClick={() => setAdjusting(item)}>
                        <SlidersHorizontal aria-hidden />
                        Adjust
                      </Button>
                    </Can>
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
      <PageHeader title="Inventory" description="Stock on hand. Sales and refunds update it automatically." />
      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search stock"
              placeholder="Search by product or SKU"
              className="pl-9"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>
          <NativeSelect aria-label="Stock status" className="sm:w-48" value={status} onChange={(event) => changeStatus(event.target.value)}>
            <option value="">All stock</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {stockStatusLabel(value)}
              </option>
            ))}
          </NativeSelect>
        </div>
        {content}
      </Card>

      <AdjustStockDialog item={adjusting} onOpenChange={(open) => !open && setAdjusting(null)} />
    </>
  );
}

import { Pencil, Plus, Search } from 'lucide-react';
import { useState } from 'react';

import { MoneyText } from '@/components/common/money-text';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Can } from '@/features/tenancy/components/can';
import { useTenant } from '@/features/tenancy/tenant-context';
import { usePageParam } from '@/hooks/use-page-param';
import { useSearchParam } from '@/hooks/use-search-param';
import { cn } from '@/lib/utils';

import { useProducts } from '../api';
import { ProductFormDialog } from '../components/product-form-dialog';
import type { Product } from '../types';

const PAGE_SIZE = 20;

export function ProductsPage() {
  const [page, setPage] = usePageParam();
  const { input, setInput, search } = useSearchParam('search');
  const query = useProducts({ page, pageSize: PAGE_SIZE, search });
  const currency = useTenant().activeBusiness?.currency ?? 'USD';
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  let content;
  if (query.isPending) {
    content = <LoadingState label="Loading products…" />;
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (query.data.items.length === 0) {
    content = search ? (
      <EmptyState title="No matching products" description="Try a different name or SKU." />
    ) : (
      <EmptyState title="No products yet" description="Add the products you sell to start recording sales." />
    );
  } else {
    content = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>SKU</TableHeaderCell>
              <TableHeaderCell className="text-right">Price</TableHeaderCell>
              <TableHeaderCell className="text-right">Cost</TableHeaderCell>
              <TableHeaderCell className="text-right">Reorder level</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Actions</span>
              </TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {query.data.items.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                <TableCell className="text-right">
                  <MoneyText amount={product.price} currency={currency} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {product.cost == null ? '—' : <MoneyText amount={product.cost} currency={currency} />}
                </TableCell>
                <TableCell className="text-right tabular-nums">{product.reorderLevel}</TableCell>
                <TableCell>
                  <Badge tone={product.active ? 'success' : 'neutral'}>{product.active ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Can permission="products:manage">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(product)} aria-label={`Edit ${product.name}`}>
                      <Pencil aria-hidden />
                    </Button>
                  </Can>
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
      <PageHeader
        title="Products"
        description="What you sell, with prices and reorder levels."
        actions={
          <Can permission="products:manage">
            <Button onClick={() => setEditing('new')}>
              <Plus aria-hidden />
              Add product
            </Button>
          </Can>
        }
      />
      <Card>
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search products"
              placeholder="Search by name or SKU"
              className="pl-9"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>
        </div>
        {content}
      </Card>

      <ProductFormDialog
        key={editing === 'new' ? 'new' : editing?.id}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        product={editing === 'new' || editing === null ? undefined : editing}
      />
    </>
  );
}

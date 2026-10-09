import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

import { MoneyText } from '@/components/common/money-text';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/features/products/api';
import type { Product } from '@/features/products/types';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface ProductPickerProps {
  currency: string;
  onPick: (product: Product) => void;
}

/** Search-as-you-type list of sellable products. */
export function ProductPicker({ currency, onPick }: ProductPickerProps) {
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim(), 250);
  const query = useProducts({ search: term, pageSize: 8, activeOnly: true }, { enabled: term.length > 0 });

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Find a product"
          placeholder="Find a product by name or SKU"
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {term && (
        <ul className="divide-y divide-border rounded-md border border-border" aria-label="Matching products">
          {query.isPending && <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>}
          {query.data?.items.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No products match “{term}”.</li>}
          {query.data?.items.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(product);
                  setSearch('');
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
                </span>
                <MoneyText amount={product.price} currency={currency} />
                <Plus aria-hidden className="size-4 text-primary" />
                <span className="sr-only">Add {product.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

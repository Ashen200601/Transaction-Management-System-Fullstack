import { List, PlusCircle } from 'lucide-react';

import { ModulePage } from '@/components/common/module-page';

const TABS = [
  { label: 'Create item', path: '/inventory/items', icon: PlusCircle },
  { label: 'Item list', path: '/inventory/items/list', icon: List },
];

/** Inventory › Items: create an item, or look items up. */
export function ItemsPage() {
  return <ModulePage title="Items" description="Add and look up the items your business sells." tabs={TABS} />;
}

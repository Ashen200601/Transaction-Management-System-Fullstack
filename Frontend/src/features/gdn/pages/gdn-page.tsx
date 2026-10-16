import { List, PlusCircle } from 'lucide-react';

import { ModulePage } from '@/components/common/module-page';

const TABS = [
  { label: 'Create GDN', path: '/inventory/gdn', icon: PlusCircle },
  { label: 'GDN list', path: '/inventory/gdn/list', icon: List },
];

/** Inventory › GDN (goods dispatch notes): record stock going out, or look up past GDNs. */
export function GdnPage() {
  return <ModulePage title="Goods Dispatch Notes" description="Record stock dispatched to customers." tabs={TABS} />;
}

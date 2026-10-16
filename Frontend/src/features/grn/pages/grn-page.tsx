import { List, PlusCircle } from 'lucide-react';

import { ModulePage } from '@/components/common/module-page';

const TABS = [
  { label: 'Create GRN', path: '/inventory/grn', icon: PlusCircle },
  { label: 'GRN list', path: '/inventory/grn/list', icon: List },
];

/** Inventory › GRN (goods received notes): record stock coming in, or look up past GRNs. */
export function GrnPage() {
  return <ModulePage title="Goods Received Notes" description="Record stock received from suppliers." tabs={TABS} />;
}

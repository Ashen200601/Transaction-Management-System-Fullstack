import { List, UserPlus } from 'lucide-react';

import { ModulePage } from '@/components/common/module-page';

const TABS = [
  { label: 'Create stakeholder', path: '/people-and-profiles/stakeholders', icon: UserPlus },
  { label: 'Stakeholder list', path: '/people-and-profiles/stakeholders/list', icon: List },
];

/** People and Profiles › Stakeholders: create a stakeholder, or look stakeholders up. */
export function StakeholdersPage() {
  return (
    <ModulePage
      title="Stakeholders"
      description="Add and look up the customers and vendors your business deals with."
      tabs={TABS}
    />
  );
}

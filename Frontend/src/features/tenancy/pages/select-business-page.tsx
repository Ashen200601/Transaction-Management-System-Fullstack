import { Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';

import { EmptyState } from '@/components/common/states';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/auth-context';

import { useTenant } from '../tenant-context';

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', cashier: 'Cashier', viewer: 'Viewer' } as const;

export function SelectBusinessPage() {
  const { businesses, selectBusiness } = useTenant();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-semibold">Choose a business</h1>
        <p className="mt-1 text-sm text-muted-foreground">Signed in as {user?.email}</p>

        {businesses.length === 0 ? (
          <EmptyState
            title="No businesses yet"
            description="You haven't been added to a business. Ask an owner to invite you."
          />
        ) : (
          <ul className="mt-5 grid gap-2">
            {businesses.map((business) => (
              <li key={business.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectBusiness(business.id);
                    navigate('/', { replace: true });
                  }}
                  className="flex w-full items-center gap-3 rounded-md border border-border p-3 text-left hover:bg-muted"
                >
                  <Building2 aria-hidden className="size-5 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{business.name}</span>
                    <span className="text-xs text-muted-foreground">{ROLE_LABELS[business.role]}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" onClick={() => void logout()} className="mt-6 text-sm text-muted-foreground underline">
          Sign out
        </button>
      </Card>
    </main>
  );
}

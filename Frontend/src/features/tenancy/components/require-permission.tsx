import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate } from 'react-router';

import { buttonVariants } from '@/components/ui/button';

import { hasPermission } from '../permissions';
import { useTenant } from '../tenant-context';
import type { Permission } from '../types';

/** Guards a page: needs an active business and a role with `permission`. */
export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { activeBusiness } = useTenant();

  if (!activeBusiness) {
    return <Navigate replace to="/select-business" />;
  }

  if (!hasPermission(activeBusiness.role, permission)) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
        <ShieldAlert aria-hidden className="size-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your role in {activeBusiness.name} doesn&apos;t include this page. Ask the business owner if you need
          access.
        </p>
        <Link to="/" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-2' })}>
          Go to dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

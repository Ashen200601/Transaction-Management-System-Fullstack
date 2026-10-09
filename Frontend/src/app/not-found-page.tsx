import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page you were looking for doesn&apos;t exist or has moved.</p>
      <Link to="/" className={buttonVariants({ variant: 'outline', className: 'mt-2' })}>
        Go to dashboard
      </Link>
    </main>
  );
}

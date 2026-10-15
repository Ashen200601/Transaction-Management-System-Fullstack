import homeDemo from '@/assets/home-demo.svg';
import { COMPANY } from '@/config/company';
import { useAuth } from '@/features/auth/auth-context';

export function HomePage() {
  const { user } = useAuth();
  const firstName = user?.name.split(' ')[0];

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div className="grid gap-1">
        <p className="text-sm font-medium text-primary">{COMPANY.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">{COMPANY.description}</p>
      </div>

      <img
        src={homeDemo}
        alt="Illustration of the Finovex dashboard with sales charts, a receipt and stock"
        className="w-full rounded-2xl border border-border bg-card shadow-sm"
      />
    </div>
  );
}

import type { AppModule } from './modules';

/** Stands in for a module whose page isn't built yet. */
export function ComingSoonPage({ module }: { module: AppModule }) {
  const Icon = module.icon;

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{module.label}</h1>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon aria-hidden className="size-6" />
        </span>
        <p className="font-medium">{module.label} is coming soon</p>
        <p className="max-w-sm text-sm text-muted-foreground">This module is being built. Check back after the next update.</p>
      </div>
    </div>
  );
}

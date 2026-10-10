import { Globe, Mail, Phone } from 'lucide-react';
import type { ReactNode } from 'react';

import { COMPANY } from '@/config/company';

function CompanyPanel() {
  const { email, phone, website } = COMPANY.contact;
  const contacts = [
    { icon: Mail, label: email, href: `mailto:${email}` },
    { icon: Phone, label: phone, href: `tel:${phone.replace(/\s+/g, '')}` },
    { icon: Globe, label: website.replace(/^https?:\/\//, ''), href: website },
  ].filter((contact) => contact.label);

  return (
    <aside className="relative hidden overflow-hidden border-r border-border bg-linear-to-br from-accent to-accent/60 lg:flex lg:flex-col lg:justify-between lg:gap-12 lg:p-12 xl:p-16">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 size-[26rem] rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-32 size-[30rem] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <img src="/favicon.svg" alt="" className="size-10" />
        <div>
          <p className="text-lg font-semibold tracking-tight">{COMPANY.name}</p>
          <p className="text-sm text-muted-foreground">{COMPANY.tagline}</p>
        </div>
      </div>

      <div className="relative grid max-w-xl gap-10">
        <div className="grid gap-4">
          <p className="text-4xl leading-tight font-semibold tracking-tight text-balance xl:text-[2.75rem]">{COMPANY.headline}</p>
          <p className="text-base text-pretty text-muted-foreground">{COMPANY.description}</p>
        </div>

        <ul className="grid gap-4 xl:grid-cols-2">
          {COMPANY.highlights.map(({ title, text, icon: Icon }) => (
            <li key={title} className="flex gap-3 rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon aria-hidden className="size-5" />
              </span>
              <div className="grid gap-0.5">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <footer className="relative grid gap-3 text-sm text-muted-foreground">
        {contacts.length > 0 && (
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {contacts.map(({ icon: Icon, label, href }) => (
              <li key={href}>
                <a href={href} className="inline-flex items-center gap-2 hover:text-foreground">
                  <Icon aria-hidden className="size-4" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        )}
        <p>
          © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </p>
      </footer>
    </aside>
  );
}

/** Two halves: company details on the left, the sign-up or sign-in form on the right. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-card lg:grid lg:grid-cols-2">
      <CompanyPanel />

      <main className="flex min-h-dvh flex-col px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <img src="/favicon.svg" alt="" className="size-9" />
          <div>
            <p className="font-semibold tracking-tight">{COMPANY.name}</p>
            <p className="text-xs text-muted-foreground">{COMPANY.tagline}</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}

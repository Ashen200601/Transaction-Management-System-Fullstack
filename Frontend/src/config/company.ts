import { Boxes, ReceiptText, ScanLine, ShieldCheck, type LucideIcon } from 'lucide-react';

export interface CompanyDetails {
  name: string;
  tagline: string;
  headline: string;
  description: string;
  highlights: ReadonlyArray<{ title: string; text: string; icon: LucideIcon }>;
  /** Each item is shown only when filled in. */
  contact: { email: string; phone: string; website: string };
}

/** Company details shown beside the sign-up and sign-in forms. Edit here to update them everywhere. */
export const COMPANY: CompanyDetails = {
  name: 'Finovex Solutions',
  tagline: 'Transaction management for growing businesses',
  headline: 'Every sale, stock move and receipt in one clear view.',
  description:
    'Finovex brings your transactions, inventory and paperwork together, so you always know where your business stands.',
  highlights: [
    { title: 'Transactions', text: 'Record sales, refunds and expenses in seconds.', icon: ReceiptText },
    { title: 'Inventory', text: 'Track stock levels and get warned before you run low.', icon: Boxes },
    { title: 'Receipt capture', text: 'Scan receipts and invoices instead of typing them in.', icon: ScanLine },
    { title: 'Secure access', text: 'Run several businesses, with the right access for every team member.', icon: ShieldCheck },
  ],
  contact: {
    email: '',
    phone: '',
    website: '',
  },
};

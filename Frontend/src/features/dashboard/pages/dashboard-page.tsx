import { Plus } from 'lucide-react';
import { Link } from 'react-router';

import { MoneyText } from '@/components/common/money-text';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/auth-context';
import { Can } from '@/features/tenancy/components/can';
import { TransactionStatusBadge } from '@/features/transactions/components/status-badges';
import { formatDateTime } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

import { useDashboardSummary } from '../api';
import { SalesChart } from '../components/sales-chart';
import { StatTile } from '../components/stat-tile';

export function DashboardPage() {
  const { user } = useAuth();
  const query = useDashboardSummary();
  const firstName = user?.name.split(' ')[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        description="Today at a glance."
        actions={
          <Can permission="transactions:create">
            <Link to="/transactions/new" className={buttonVariants()}>
              <Plus aria-hidden />
              New sale
            </Link>
          </Can>
        }
      />

      {query.isPending ? (
        <LoadingState label="Loading today's figures…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Sales today"
              value={formatMoney(query.data.salesToday, query.data.currency)}
              change={query.data.salesChange}
              hint="vs yesterday"
            />
            <StatTile
              label="Transactions today"
              value={query.data.transactionsToday}
              change={query.data.transactionsChange}
              hint="vs yesterday"
            />
            <StatTile label="Average sale" value={formatMoney(query.data.averageSale, query.data.currency)} hint="today" />
            <StatTile
              label="Low or out of stock"
              value={query.data.lowStockCount}
              hint={query.data.lowStockCount > 0 ? 'products need reordering' : 'all stocked'}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Last 7 days</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesChart days={query.data.salesByDay} currency={query.data.currency} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recent transactions</CardTitle>
                <Link to="/transactions" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {query.data.recentTransactions.length === 0 ? (
                  <EmptyState title="No transactions yet" />
                ) : (
                  <ul className="divide-y divide-border">
                    {query.data.recentTransactions.map((transaction) => (
                      <li key={transaction.id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <Link to={`/transactions/${transaction.id}`} className="text-sm font-medium hover:underline">
                            {transaction.reference}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {transaction.customerName ?? 'Walk-in customer'} · {formatDateTime(transaction.createdAt)}
                          </p>
                        </div>
                        <TransactionStatusBadge status={transaction.status} />
                        <MoneyText
                          amount={transaction.type === 'refund' ? -transaction.total : transaction.total}
                          currency={transaction.currency}
                          className="text-sm font-medium"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

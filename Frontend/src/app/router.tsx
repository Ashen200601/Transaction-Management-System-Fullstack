import { lazy, type ReactNode } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';

import { RequireAuth } from '@/features/auth/components/require-auth';
import { AuthCallbackPage } from '@/features/auth/pages/auth-callback-page';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RequirePermission } from '@/features/tenancy/components/require-permission';
import { SelectBusinessPage } from '@/features/tenancy/pages/select-business-page';
import { TenantProvider } from '@/features/tenancy/tenant-context';
import type { Permission } from '@/features/tenancy/types';
import { AppLayout } from '@/layouts/app-layout';

import { NotFoundPage } from './not-found-page';

// Feature pages load on demand, keeping the first download small.
const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page').then((m) => ({ default: m.DashboardPage })));
const TransactionsPage = lazy(() =>
  import('@/features/transactions/pages/transactions-page').then((m) => ({ default: m.TransactionsPage })),
);
const NewTransactionPage = lazy(() =>
  import('@/features/transactions/pages/new-transaction-page').then((m) => ({ default: m.NewTransactionPage })),
);
const TransactionDetailPage = lazy(() =>
  import('@/features/transactions/pages/transaction-detail-page').then((m) => ({ default: m.TransactionDetailPage })),
);
const CustomersPage = lazy(() => import('@/features/customers/pages/customers-page').then((m) => ({ default: m.CustomersPage })));
const ProductsPage = lazy(() => import('@/features/products/pages/products-page').then((m) => ({ default: m.ProductsPage })));
const InventoryPage = lazy(() => import('@/features/inventory/pages/inventory-page').then((m) => ({ default: m.InventoryPage })));
const DocumentsPage = lazy(() => import('@/features/ocr/pages/documents-page').then((m) => ({ default: m.DocumentsPage })));
const CapturePage = lazy(() => import('@/features/ocr/pages/capture-page').then((m) => ({ default: m.CapturePage })));
const DocumentReviewPage = lazy(() =>
  import('@/features/ocr/pages/document-review-page').then((m) => ({ default: m.DocumentReviewPage })),
);
const IntegrationsPage = lazy(() =>
  import('@/features/integrations/pages/integrations-page').then((m) => ({ default: m.IntegrationsPage })),
);

const guard = (permission: Permission, page: ReactNode) => (
  <RequirePermission permission={permission}>{page}</RequirePermission>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  {
    element: (
      <RequireAuth>
        <TenantProvider>
          <Outlet />
        </TenantProvider>
      </RequireAuth>
    ),
    children: [
      { path: '/select-business', element: <SelectBusinessPage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: guard('dashboard:view', <DashboardPage />) },
          { path: '/transactions', element: guard('transactions:view', <TransactionsPage />) },
          { path: '/transactions/new', element: guard('transactions:create', <NewTransactionPage />) },
          { path: '/transactions/:id', element: guard('transactions:view', <TransactionDetailPage />) },
          { path: '/customers', element: guard('customers:view', <CustomersPage />) },
          { path: '/products', element: guard('products:view', <ProductsPage />) },
          { path: '/inventory', element: guard('inventory:view', <InventoryPage />) },
          { path: '/documents', element: guard('documents:review', <DocumentsPage />) },
          { path: '/documents/capture', element: guard('documents:review', <CapturePage />) },
          { path: '/documents/:id', element: guard('documents:review', <DocumentReviewPage />) },
          { path: '/integrations', element: guard('integrations:manage', <IntegrationsPage />) },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

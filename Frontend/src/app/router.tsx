import { createBrowserRouter, Navigate } from 'react-router';

import { RequireAuth } from '@/features/auth/components/require-auth';
import { LoginPage } from '@/features/auth/pages/login-page';
import { SignupPage } from '@/features/auth/pages/signup-page';
import { GdnCreatePage } from '@/features/gdn/pages/gdn-create-page';
import { GdnListPage } from '@/features/gdn/pages/gdn-list-page';
import { GdnPage } from '@/features/gdn/pages/gdn-page';
import { GrnCreatePage } from '@/features/grn/pages/grn-create-page';
import { GrnListPage } from '@/features/grn/pages/grn-list-page';
import { GrnPage } from '@/features/grn/pages/grn-page';
import { ItemCreatePage } from '@/features/items/pages/item-create-page';
import { ItemListPage } from '@/features/items/pages/item-list-page';
import { ItemsPage } from '@/features/items/pages/items-page';
import { StakeholderCreatePage } from '@/features/stakeholders/pages/stakeholder-create-page';
import { StakeholderListPage } from '@/features/stakeholders/pages/stakeholder-list-page';
import { StakeholdersPage } from '@/features/stakeholders/pages/stakeholders-page';

import { AppLayout } from './app-layout';
import { ComingSoonPage } from './coming-soon-page';
import { HomePage } from './home-page';
import { APP_MODULES } from './modules';
import { NotFoundPage } from './not-found-page';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: '/people-and-profiles',
        children: [
          { index: true, element: <Navigate to="/people-and-profiles/stakeholders" replace /> },
          {
            path: 'stakeholders',
            element: <StakeholdersPage />,
            children: [
              { index: true, element: <StakeholderCreatePage /> },
              { path: 'list', element: <StakeholderListPage /> },
            ],
          },
        ],
      },
      {
        path: '/inventory',
        children: [
          { index: true, element: <Navigate to="/inventory/items" replace /> },
          {
            path: 'items',
            element: <ItemsPage />,
            children: [
              { index: true, element: <ItemCreatePage /> },
              { path: 'list', element: <ItemListPage /> },
            ],
          },
          {
            path: 'grn',
            element: <GrnPage />,
            children: [
              { index: true, element: <GrnCreatePage /> },
              { path: 'list', element: <GrnListPage /> },
            ],
          },
          {
            path: 'gdn',
            element: <GdnPage />,
            children: [
              { index: true, element: <GdnCreatePage /> },
              { path: 'list', element: <GdnListPage /> },
            ],
          },
        ],
      },
      // Modules that aren't built yet show a placeholder; replace each with its page as it's built.
      ...APP_MODULES.filter((module) => !module.ready).map((module) => ({
        path: module.path,
        element: <ComingSoonPage module={module} />,
      })),
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

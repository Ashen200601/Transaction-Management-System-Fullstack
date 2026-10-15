import { createBrowserRouter } from 'react-router';

import { RequireAuth } from '@/features/auth/components/require-auth';
import { LoginPage } from '@/features/auth/pages/login-page';
import { SignupPage } from '@/features/auth/pages/signup-page';
import { ItemCreatePage } from '@/features/items/pages/item-create-page';
import { ItemListPage } from '@/features/items/pages/item-list-page';
import { ItemsPage } from '@/features/items/pages/items-page';

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
        path: '/items',
        element: <ItemsPage />,
        children: [
          { index: true, element: <ItemCreatePage /> },
          { path: 'list', element: <ItemListPage /> },
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

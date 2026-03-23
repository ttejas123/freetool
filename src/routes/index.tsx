import { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Home } from '@/pages/Home';
import { toolRegistry } from '@/tools/toolRegistry';
import { ToolPageTemplate } from '@/components/tools/ToolPageTemplate';

// Minimal, Vercel-like Suspense fallback
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      ...toolRegistry.map((tool) => ({
        path: tool.path,
        element: tool.type === 'heavy' ? (
          <Suspense fallback={<PageLoader />}>
            <ToolPageTemplate tool={tool}>
              <tool.component />
            </ToolPageTemplate>
          </Suspense>
        ) : (
          <ToolPageTemplate tool={tool}>
            <tool.component />
          </ToolPageTemplate>
        ),
      })),
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

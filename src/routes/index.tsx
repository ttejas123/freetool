import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
// import { AppLayout } from '@/components/layout/AppLayout';
import { Home } from '@/pages/Home';
import { Redirect } from '@/pages/Redirect';
import { toolRegistry } from '@/tools/toolRegistry';
import { ToolPageTemplate } from '@/components/tools/ToolPageTemplate';

// Minimal, Vercel-like Suspense fallback
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
  </div>
);

// Legal Pages (Lazy Loaded)
const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const About = lazy(() => import('@/pages/About').then(m => ({ default: m.About })));
const Contact = lazy(() => import('@/pages/Contact').then(m => ({ default: m.Contact })));
const Terms = lazy(() => import('@/pages/Terms').then(m => ({ default: m.Terms })));
const Blogs = lazy(() => import('@/pages/Blogs').then(m => ({ default: m.Blogs })));
const TechNews = lazy(() => import('@/pages/TechNews').then(m => ({ default: m.TechNews })));

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
        element: (
          <Suspense fallback={<PageLoader />}>
            <ToolPageTemplate tool={tool}>
              <tool.component />
            </ToolPageTemplate>
          </Suspense>
        ),
      })),
      {
        path: 'privacy-policy',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivacyPolicy />
          </Suspense>
        ),
      },
      {
        path: 'contact',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Contact />
          </Suspense>
        ),
      },
      {
        path: 'about',
        element: (
          <Suspense fallback={<PageLoader />}>
            <About />
          </Suspense>
        ),
      },
      {
        path: 'terms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Terms />
          </Suspense>
        ),
      },
      {
        path: 'blogs',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Blogs />
          </Suspense>
        ),
      },
      {
        path: 'tech-news',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TechNews />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
  {
    path: '/t',
    element: <Redirect />,
  },
]);

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const WeeklyProgress = lazy(() => import("@/pages/WeeklyProgress"));
const MonthlyReports = lazy(() => import("@/pages/MonthlyReports"));

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Helmet>
        <html lang="en" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="application-name" content="Mind Tracker" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://mindtracker.app" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Mind Tracker" />
        <meta property="og:url" content="https://mindtracker.app" />
        <meta property="og:title" content="Mind Tracker - Habit Tracking Platform" />
        <meta property="og:description" content="Track your daily habits, monitor progress, and achieve your goals with Mind Tracker." />
        <meta property="og:image" content="https://mindtracker.app/og-image.png" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mind Tracker - Habit Tracking Platform" />
        <meta name="twitter:description" content="Track your daily habits, monitor progress, and achieve your goals with Mind Tracker." />
        <meta name="twitter:image" content="https://mindtracker.app/og-image.png" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Mind Tracker",
            url: "https://mindtracker.app",
            description: "A comprehensive habit tracking platform for monitoring daily habits and achieving goals.",
            applicationCategory: "LifestyleApplication",
            operatingSystem: "All",
            browserRequirements: "Requires JavaScript",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            author: {
              "@type": "Organization",
              name: "Mind Tracker",
              url: "https://mindtracker.app",
            },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Dashboard", item: "https://mindtracker.app/dashboard" },
              { "@type": "ListItem", position: 2, name: "Weekly Progress", item: "https://mindtracker.app/weekly" },
              { "@type": "ListItem", position: 3, name: "Monthly Reports", item: "https://mindtracker.app/monthly" },
            ],
          })}
        </script>
      </Helmet>

      <Routes>
        <Route path="/login" element={<PublicRoute><Suspense fallback={<PageLoader />}><Login /></Suspense></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Suspense fallback={<PageLoader />}><Register /></Suspense></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></ProtectedRoute>} />
        <Route path="/weekly" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><WeeklyProgress /></Suspense></ProtectedRoute>} />
        <Route path="/monthly" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><MonthlyReports /></Suspense></ProtectedRoute>} />

        <Route path="/reports" element={<ProtectedRoute><PlaceholderPage title="Reports" /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PlaceholderPage title="Settings" /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PlaceholderPage title="Profile" /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

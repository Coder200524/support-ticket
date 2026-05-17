// =============================================
// frontend/src/App.jsx
// =============================================
// Main Application Component with Routing
//
// WHAT IS REACT ROUTER?
// React Router lets you build a Single Page Application (SPA).
// In a SPA, when you navigate to /dashboard or /login,
// the PAGE DOESN'T RELOAD. React Router intercepts the URL
// and renders different components based on the path.
//
// Route types:
// <Route path="/" element={<Component />}> → renders Component at /
// <Navigate to="/login" /> → automatically redirects
//
// Protected routes: wrap routes that need auth with our
// <ProtectedRoute> component which redirects to /login
// =============================================

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CreateTicketPage = lazy(() => import('./pages/CreateTicketPage'));
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage'));
const AgentDashboardPage = lazy(() => import('./pages/AgentDashboardPage'));

function App() {
  return (
    // AuthProvider wraps the entire app, making auth data available everywhere
    <AuthProvider>
      {/* BrowserRouter: Uses the HTML5 History API for clean URLs (no #) */}
      <Router>
        {/*
          Toaster: Global notification system (react-hot-toast)
          These toast notifications appear from anywhere with:
          toast.success("Done!") or toast.error("Failed!")
        */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#f1f5f9' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' },
            },
          }}
        />

        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-slate-400">Loading...</div>}>
          <Routes>
            {/* =============================================
                PUBLIC ROUTES (no auth required)
                ============================================= */}

          {/* Login Page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Register Page */}
          <Route path="/register" element={<RegisterPage />} />

          {/* =============================================
              CUSTOMER ROUTES (requires: any logged-in user)
              ============================================= */}

          {/* Customer Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="customer">
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Create New Ticket */}
          <Route
            path="/tickets/new"
            element={
              <ProtectedRoute role="customer">
                <CreateTicketPage />
              </ProtectedRoute>
            }
          />

          {/* View Ticket Details (both customer and agent) */}
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <TicketDetailPage />
              </ProtectedRoute>
            }
          />

          {/* =============================================
              AGENT ROUTES (requires: agent role)
              ============================================= */}

          {/* Agent Dashboard */}
          <Route
            path="/agent/dashboard"
            element={
              <ProtectedRoute role="agent">
                <AgentDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* =============================================
              REDIRECTS
              ============================================= */}

          {/* Root path: redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Catch-all: any unknown URL → redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;

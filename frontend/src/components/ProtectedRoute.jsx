// =============================================
// frontend/src/components/ProtectedRoute.jsx
// =============================================
// Protected Route Component
//
// WHAT IS A PROTECTED ROUTE?
// Some pages should only be accessible to logged-in users.
// For example, /dashboard should redirect to /login
// if the user isn't authenticated.
//
// React Router v6 doesn't have built-in protected routes,
// so we create a custom wrapper component.
//
// HOW IT WORKS:
// <ProtectedRoute> wraps route elements that need auth.
// If not logged in → redirect to /login
// If logged in but wrong role → redirect to their dashboard
// If logged in and correct role → show the component
// =============================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute: Requires authentication
 * @param {ReactNode} children - The page component to render if allowed
 * @param {string} role - Required role: "customer" | "agent" | undefined (any)
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show nothing while we're checking auth status (startup check)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login, save where they were going
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their own dashboard
  if (role && user?.role !== role) {
    const redirectPath = user?.role === 'agent' ? '/agent/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // All good → render the protected component
  return children;
};

export default ProtectedRoute;

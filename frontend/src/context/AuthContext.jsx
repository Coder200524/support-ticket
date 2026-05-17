// =============================================
// frontend/src/context/AuthContext.jsx
// =============================================
// Authentication Context
//
// WHAT IS REACT CONTEXT?
// React Context is a way to share data between components
// WITHOUT passing it as props through every level.
//
// PROBLEM without Context (Prop Drilling):
//   App → Header → NavBar → UserMenu → Avatar
//   You'd have to pass "user" as a prop at every level!
//
// SOLUTION with Context:
//   Any component can access the "user" directly:
//   const { user } = useAuth();
//   No matter how deep in the component tree!
//
// Our AuthContext provides:
// - user: the logged-in user object
// - token: the JWT token
// - login(): function to log in
// - logout(): function to log out
// - loading: whether we're checking auth status
//
// =============================================

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

// 1. Create the context object
const AuthContext = createContext(null);

// 2. Create the Provider component
// This wraps our entire app and provides auth data to all children
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // True while checking localStorage

  // On app startup: check if user is already logged in
  // (Token might be stored from a previous session)
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Parse the stored user object
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Verify the token is still valid by calling /me endpoint
          // This also refreshes user data in case it changed
          const { data } = await api.get('/auth/me');
          setUser(data.data.user);
        } catch (error) {
          // Token is invalid or expired - clear storage
          console.log('Session expired, please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }

      setLoading(false); // Done checking
    };

    initAuth();
  }, []);

  /**
   * Login function
   * Called after successful login API response
   * Stores token and user in state + localStorage
   */
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  /**
   * Logout function
   * Clears all auth state and storage
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // The value object - everything provided to consuming components
  const value = {
    user,          // null if not logged in, user object if logged in
    loading,       // true while checking auth status on startup
    login,         // function to call after successful login
    logout,        // function to call on logout
    isAuthenticated: !!user, // boolean - true if user is logged in
    isAgent: user?.role === 'agent', // boolean - true if user is an agent
    isCustomer: user?.role === 'customer',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook for easy access to auth context
// Instead of: const auth = useContext(AuthContext)
// Just do:    const { user, login } = useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// =============================================
// frontend/src/api/axios.js
// =============================================
// Axios HTTP Client Configuration
//
// WHAT IS AN AXIOS INSTANCE?
// Instead of importing axios directly and configuring it
// every time, we create a custom instance with:
// - Default base URL (our backend API)
// - Request interceptors (auto-attach JWT token)
// - Response interceptors (handle auth errors globally)
//
// INTERCEPTORS:
// An interceptor is a function that runs BEFORE a request
// is sent or AFTER a response is received.
//
// Request interceptor: "Before every API call, attach the JWT token"
// Response interceptor: "If server returns 401, redirect to login"
// =============================================

import axios from 'axios';

// Create a custom axios instance
// All requests made with this instance will have these defaults
const api = axios.create({
  // Base URL: all requests will be prefixed with this
  // import.meta.env.VITE_API_URL reads from frontend/.env
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',

  // Request timeout: if server doesn't respond in 10s, fail
  timeout: 10000,
});

// =============================================
// REQUEST INTERCEPTOR
// Runs BEFORE every API request is sent
// =============================================
api.interceptors.request.use(
  (config) => {
    // Get the JWT token from localStorage
    const token = localStorage.getItem('token');

    if (token) {
      // Attach the token to the Authorization header
      // The format "Bearer <token>" is the industry standard
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // Return the modified config
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================
// RESPONSE INTERCEPTOR
// Runs AFTER every API response is received
// =============================================
api.interceptors.response.use(
  (response) => {
    // If response is successful (2xx status), just return it
    return response;
  },
  (error) => {
    // If the server returned a 401 (Unauthorized), the token is invalid/expired
    // Clear the stored credentials and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

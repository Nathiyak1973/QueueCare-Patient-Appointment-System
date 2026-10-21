import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('carequeue_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if already on login/register
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register') && !path.includes('/about') && path !== '/') {
        localStorage.removeItem('carequeue_token');
        localStorage.removeItem('carequeue_user');
      }
    }
    return Promise.reject(error);
  }
);

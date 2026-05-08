import axios from 'axios';
import { config } from './config';
import { ensureSuccess } from './helpers';

const apiClient = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

// 1. Request Interceptor: Attach Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const timestamp = localStorage.getItem('token_timestamp');
  if (token && timestamp) {
    const age = Date.now() - parseInt(timestamp);
    const expiry = 3600 * 1000; // 1 hour
    if (age < expiry) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Token expired, clear it
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_timestamp');
    }
  }
  return config;
});

// 2. Response Interceptor: Handle Refresh & Expiry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login with returnUrl
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_timestamp');
      const returnUrl = `${window.location.pathname}${window.location.search}`
      window.location.href = `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
      return Promise.reject(error);
    }

    ensureSuccess(error.response);
    return Promise.reject(error);
  }
);

export default apiClient;

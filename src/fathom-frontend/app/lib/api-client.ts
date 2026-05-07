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
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Response Interceptor: Handle Refresh & Expiry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        // Call your refresh endpoint
        const res = await axios.post(`${config.apiUrl}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = res.data;
        localStorage.setItem('access_token', access_token);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear storage and redirect
        localStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    ensureSuccess(error.response);
    return Promise.reject(error);
  }
);

export default apiClient;

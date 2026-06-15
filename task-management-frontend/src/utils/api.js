const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

/* ================= TOKEN STORE ================= */
export const tokenStore = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

 
  setTokens({ token, refreshToken }) {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token); // MAP token → accessToken
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

import axios from 'axios';
import { API_BASE_URL } from './constants';

/* ================= AXIOS CLIENT ================= */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // If backend returns data inside response.data (e.g. { success: true, data: ... }),
    // we return response.data to match frontend expectations.
    return response.data;
  },
  async (error) => {
    // Handle 401 Unauthorized (Token expired, etc.)
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = tokenStore.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        // Gọi API refresh token
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = res.data.accessToken || res.data.token;
        if (newToken) {
          tokenStore.setAccessToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (err) {
        tokenStore.clear();
        // Redirect to login only if we are not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }
    // Return structured error message if backend provides it
    return Promise.reject(error.response?.data || error);
  }
);

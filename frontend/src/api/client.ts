import axios from 'axios';

// Automatically target the live backend API URL on Render
const isRenderHost = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
const defaultBackendUrl = isRenderHost ? 'https://erpcyber.onrender.com/api' : '/api';
const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || defaultBackendUrl;

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(config => config, error => Promise.reject(error));

// Response interceptor — handle auth errors safely
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle session expiration
    }
    return Promise.reject(error);
  }
);

export default api;

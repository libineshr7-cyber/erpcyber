import { api } from './client';
import { LoginResponse } from '../types/auth.types';

export const authApi = {
  login: (data: any) => api.post<LoginResponse>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

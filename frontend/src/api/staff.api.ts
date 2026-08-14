import { api } from './client';
import { Staff } from '../types/staff.types';

export const staffApi = {
  getAll: () => api.get<Staff[]>('/staff'),
  getById: (id: string) => api.get<Staff>(`/staff/${id}`),
};

import { api } from './client';
import { Subject } from '../types/academic.types';

export const subjectsApi = {
  getAll: () => api.get<Subject[]>('/subjects'),
};

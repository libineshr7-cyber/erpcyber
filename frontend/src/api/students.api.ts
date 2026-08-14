import { api } from './client';
import { Student } from '../types/student.types';

export const studentsApi = {
  getAll: () => api.get<Student[]>('/students'),
  getById: (id: string) => api.get<Student>(`/students/${id}`),
};

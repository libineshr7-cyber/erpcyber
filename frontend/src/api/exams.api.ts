import { api } from './client';
import { Exam } from '../types/academic.types';

export const examsApi = {
  getAll: () => api.get<Exam[]>('/exams'),
};

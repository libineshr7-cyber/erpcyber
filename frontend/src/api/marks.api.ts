import { api } from './client';
import { MarkEntry } from '../types/marks.types';

export const marksApi = {
  getByClass: (filters: any) => api.get<MarkEntry[]>('/marks', { params: filters }),
  saveDraft: (data: any) => api.post('/marks/draft', data),
  submitForApproval: (data: any) => api.post('/marks/submit', data),
};

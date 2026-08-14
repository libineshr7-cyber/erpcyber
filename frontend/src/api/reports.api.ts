import { api } from './client';
import { Report } from '../types/report.types';

export const reportsApi = {
  getByStudent: (id: string) => api.get<Report[]>(`/reports/student/${id}`),
};

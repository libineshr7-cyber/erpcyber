import { api } from './client';

export const attendanceApi = {
  getByStudent: (id: string) => api.get(`/attendance/student/${id}`),
};

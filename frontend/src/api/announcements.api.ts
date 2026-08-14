import { api } from './client';

export const announcementsApi = {
  getAll: () => api.get('/announcements'),
};

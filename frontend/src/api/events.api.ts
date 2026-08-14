import { api } from './client';
import { Event } from '../types/events.types';

export const eventsApi = {
  getAll: () => api.get<Event[]>('/events'),
};

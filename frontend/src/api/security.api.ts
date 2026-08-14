import { api } from './client';
import { SecurityEvent, ActiveSession } from '../types/security.types';

export const securityApi = {
  getEvents: () => api.get<SecurityEvent[]>('/security/events'),
  getSessions: () => api.get<ActiveSession[]>('/security/sessions'),
  terminateSession: (id: string) => api.delete(`/security/sessions/${id}`),
};

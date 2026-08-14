import { api } from './client';
import { WhatsAppMessage } from '../types/whatsapp.types';

export const whatsappApi = {
  sendSingle: (data: any) => api.post('/whatsapp/send', data),
  sendBulk: (data: any) => api.post('/whatsapp/send-bulk', data),
  getStatus: () => api.get<WhatsAppMessage[]>('/whatsapp/status'),
};

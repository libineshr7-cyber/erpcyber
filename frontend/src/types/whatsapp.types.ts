export interface WhatsAppMessage {
  id: string;
  studentId: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  sentAt: string;
}

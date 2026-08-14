export interface SecurityEvent {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  description: string;
  user: string;
  timestamp: string;
  status: 'OPEN' | 'RESOLVED';
}
export interface ActiveSession {
  id: string;
  userId: string;
  username: string;
  role: string;
  browser: string;
  loginTime: string;
  lastActivity: string;
}

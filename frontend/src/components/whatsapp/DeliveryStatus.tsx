import React from 'react';
import { Badge } from '../ui/Badge';

export const DeliveryStatus: React.FC<{ status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' }> = ({ status }) => {
  const map = {
    PENDING: 'warning',
    SENT: 'info',
    DELIVERED: 'success',
    FAILED: 'danger'
  } as const;
  
  return <Badge variant={map[status]}>{status}</Badge>;
};

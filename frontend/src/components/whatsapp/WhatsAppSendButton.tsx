import React from 'react';
import { Button } from '../ui/Button';

export const WhatsAppSendButton: React.FC<{ studentId: string }> = ({ studentId }) => {
  return (
    <Button variant="primary" className="flex gap-2">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
         <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.12.551 4.195 1.6 6.012L.098 24l6.113-1.603c1.761.97 3.766 1.482 5.82 1.482 6.645 0 12.031-5.386 12.031-12.031C24.062 5.386 18.676 0 12.031 0zm0 21.84c-1.782 0-3.528-.48-5.06-1.385l-.36-.214-3.76.985.998-3.664-.236-.374a10.02 10.02 0 0 1-1.552-5.347c0-5.545 4.512-10.057 10.057-10.057 5.545 0 10.058 4.512 10.058 10.057 0 5.545-4.513 10.057-10.058 10.057z"/>
      </svg>
      Send Report
    </Button>
  );
};

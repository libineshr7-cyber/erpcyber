import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const MFASetupPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
      <Card className="w-full max-w-md text-center">
        <h2 className="heading-2 mb-4">Setup MFA</h2>
        <div className="w-48 h-48 bg-white mx-auto mb-6 flex items-center justify-center text-slate-800">
          QR Code
        </div>
        <Button className="w-full">Continue to Verification</Button>
      </Card>
    </div>
  );
};

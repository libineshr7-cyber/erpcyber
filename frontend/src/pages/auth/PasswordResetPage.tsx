import React from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const PasswordResetPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
      <Card className="w-full max-w-md">
        <h2 className="heading-2 mb-6">Reset Password</h2>
        <Input label="Email Address" type="email" />
        <Button className="w-full mt-6">Send Reset Link</Button>
      </Card>
    </div>
  );
};

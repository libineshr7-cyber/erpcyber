import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const MFAPage: React.FC = () => {
  const [code, setCode] = useState('');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
      <Card className="w-full max-w-md">
        <h2 className="heading-2 text-center mb-6">Two-Factor Authentication</h2>
        <Input 
          label="Enter 6-digit code" 
          maxLength={6} 
          value={code} 
          onChange={e => setCode(e.target.value)} 
          className="text-center tracking-widest text-lg" 
        />
        <Button className="w-full mt-6">Verify</Button>
      </Card>
    </div>
  );
};

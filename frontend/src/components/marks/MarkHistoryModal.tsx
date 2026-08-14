import React from 'react';
import { Modal } from '../ui/Modal';

export const MarkHistoryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark History">
      <div className="text-slate-300">History details will be displayed here...</div>
    </Modal>
  );
};

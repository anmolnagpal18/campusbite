import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg glass-card p-6 rounded-2xl border border-white/10 shadow-2xl z-10">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <h3 className="text-lg font-bold text-gray-100">{title}</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
export default Modal;

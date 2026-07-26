import React from 'react';
import { Check, Clock, ShieldAlert } from 'lucide-react';

export const OrderTimeline = ({ status }) => {
  const steps = [
    { label: 'Order Placed', statuses: ['PENDING', 'PREPARING', 'READY', 'COMPLETED'] },
    { label: 'Payment Successful', statuses: ['PENDING', 'PREPARING', 'READY', 'COMPLETED'] },
    { label: 'Preparing', statuses: ['PREPARING', 'READY', 'COMPLETED'] },
    { label: 'Ready', statuses: ['READY', 'COMPLETED'] },
    { label: 'Completed', statuses: ['COMPLETED'] }
  ];

  const isCancelled = status === 'CANCELLED';

  return (
    <div className="w-full py-6">
      {isCancelled ? (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">Order Cancelled</h4>
            <p className="text-xs text-gray-400 mt-0.5">This order has been terminated. Stock items returned to inventory.</p>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
          {/* Connector Line for Desktop */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/5 hidden md:block z-0" />

          {steps.map((step, idx) => {
            const isDone = step.statuses.includes(status);
            const isCurrent = (status === 'PENDING' && idx < 2) || 
                              (status === 'PREPARING' && idx === 2) || 
                              (status === 'READY' && idx === 3) || 
                              (status === 'COMPLETED' && idx === 4);

            return (
              <div key={idx} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 flex-1">
                {/* Icon wrapper */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs transition-colors duration-300 ${
                  isDone 
                    ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' 
                    : isCurrent 
                      ? 'bg-purple-500/20 border-purple-500 text-purple-400 animate-pulse'
                      : 'bg-[#121020] border-white/5 text-gray-500'
                }`}>
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span className={`text-[11px] font-black uppercase tracking-widest text-center ${
                  isDone || isCurrent ? 'text-gray-200' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;

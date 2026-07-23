export const OrderTimeline = ({ currentStatus }) => {
  const statuses = [
    { id: 'PENDING', label: 'Order Placed', desc: 'Awaiting vendor confirmation' },
    { id: 'CONFIRMED', label: 'Confirmed', desc: 'Vendor accepted order' },
    { id: 'PREPARING', label: 'Preparing', desc: 'Food is being prepared' },
    { id: 'READY_FOR_PICKUP', label: 'Ready', desc: 'Ready for pickup' },
    { id: 'COMPLETED', label: 'Completed', desc: 'Order picked up' },
  ];

  const currentIndex = statuses.findIndex(s => s.id === currentStatus);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 -z-10" 
          style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
        />
        
        {statuses.map((status, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <div key={status.id} className="flex flex-col items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-4 ${
                isCompleted ? 'bg-blue-600 border-blue-100 dark:border-blue-900' : 'bg-slate-200 dark:bg-slate-700 border-white dark:border-slate-800'
              }`}>
                {isCompleted && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="text-center">
                <p className={`text-xs font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{status.label}</p>
                <p className="text-[10px] text-slate-400 hidden sm:block max-w-[80px]">{status.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

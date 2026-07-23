import { useWebSocket } from '../../hooks/useWebSocket';

const NotificationCenter = () => {
  const { isConnected } = useWebSocket('/ws/notifications/');

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {isConnected ? 'Live Updates Active' : 'Offline Mode'}
      </span>
    </div>
  );
};

export default NotificationCenter;

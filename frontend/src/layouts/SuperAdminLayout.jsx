import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <nav className="w-full bg-slate-900 dark:bg-black shadow p-4 flex justify-between items-center text-white border-b border-slate-700">
        <div className="text-xl font-bold text-red-500">Super Admin (System)</div>
        <div className="flex gap-4 items-center">
          <span>Root: {user?.email}</span>
          <button onClick={logout} className="hover:underline text-red-400">Logout</button>
        </div>
      </nav>
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default SuperAdminLayout;

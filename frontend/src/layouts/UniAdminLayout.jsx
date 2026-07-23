import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UniAdminLayout = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <nav className="w-full bg-purple-700 dark:bg-purple-900 shadow p-4 flex justify-between items-center text-white">
        <div className="text-xl font-bold">University Admin</div>
        <div className="flex gap-4 items-center">
          <span>{user?.first_name}</span>
          <button onClick={logout} className="hover:underline">Logout</button>
        </div>
      </nav>
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default UniAdminLayout;

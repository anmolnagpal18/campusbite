import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <nav className="w-full bg-white dark:bg-slate-800 shadow p-4 flex justify-between items-center">
        <div className="text-xl font-bold text-blue-600">Student Portal</div>
        <div className="flex gap-4 items-center">
          <span className="text-slate-600 dark:text-slate-300">Hi, {user?.first_name}</span>
          <button onClick={logout} className="text-red-500 hover:underline">Logout</button>
        </div>
      </nav>
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default StudentLayout;

import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow p-8 border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">Logout</button>
        </div>
        <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg">
          <p className="text-lg font-medium text-slate-800 dark:text-slate-200">Welcome, {user?.first_name} {user?.last_name}!</p>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Role: <span className="font-bold text-blue-600 dark:text-blue-400">{user?.role}</span></p>
          <p className="text-slate-600 dark:text-slate-400">Email: {user?.email}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

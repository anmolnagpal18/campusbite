import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
      <h2 className="text-2xl font-bold mb-4">Student Overview</h2>
      <p className="text-slate-600 dark:text-slate-400">Welcome, {user?.first_name}. Here you can browse menus, pre-book food, and generate QR codes.</p>
    </div>
  );
};
export default StudentDashboard;

import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
    <h1 className="text-4xl font-bold mb-4">403 - Unauthorized</h1>
    <p className="mb-6">You do not have permission to view this page.</p>
    <Link to="/dashboard" className="text-blue-600 hover:underline">Return to Dashboard</Link>
  </div>
);

export default UnauthorizedPage;

import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
    <h1 className="text-6xl font-extrabold mb-4 text-blue-600">404</h1>
    <p className="mb-6 text-xl">Oops! The page you're looking for doesn't exist.</p>
    <Link to="/" className="text-white bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition">Go Home</Link>
  </div>
);

export default NotFoundPage;

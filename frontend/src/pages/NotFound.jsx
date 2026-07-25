import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRoute } from '../components/ProtectedRoute';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';
import ROUTES from '../routes/constants';

export const NotFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (user) {
      navigate(getDashboardRoute(user.role));
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0a14] px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full glass-card p-8 md:p-10 rounded-3xl relative z-10 text-center border border-white/5 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 animate-bounce">
            <HelpCircle className="h-16 w-16 text-purple-400" />
          </div>
        </div>

        <h1 className="text-5xl font-extrabold text-white tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300 mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          The page you are looking for does not exist or has been moved to a different URL.
        </p>

        <Button
          onClick={handleGoBack}
          icon={<ArrowLeft className="h-4 w-4" />}
          className="w-full"
        >
          Go back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

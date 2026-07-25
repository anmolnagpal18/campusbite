import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRoute } from '../components/ProtectedRoute';
import { RefreshCw, Clock, XCircle, LogOut } from 'lucide-react';
import { Button } from '../components/common/Button';
import ROUTES from '../routes/constants';
import toast from 'react-hot-toast';

export const Approval = () => {
  const { user, refreshStatus, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleRecheck = async () => {
    setChecking(true);
    try {
      const refreshed = await refreshStatus();
      if (refreshed.status === 'APPROVED') {
        toast.success('Congratulations! Your account has been approved.');
        navigate(getDashboardRoute(refreshed.role));
      } else {
        toast.error(`Your account status is still ${refreshed.status.toLowerCase()}.`);
      }
    } catch (err) {
      toast.error('Failed to verify approval status.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const getStatusContent = () => {
    const isPending = user.status === 'PENDING';
    
    if (isPending) {
      let message = '';
      if (user.role === 'COLLEGE_ADMIN') {
        message = 'Your account is awaiting approval from the Super Admin. Please wait until your request is approved.';
      } else if (user.role === 'VENDOR') {
        message = 'Your account is awaiting approval from the College Admin. Please wait until your request is approved.';
      } else if (user.role === 'STAFF') {
        message = 'Your account is awaiting Vendor approval. Please wait until your request is approved.';
      }

      return {
        title: 'Account Pending Approval',
        icon: <Clock className="h-16 w-16 text-amber-400 animate-pulse" />,
        message: message,
        bgGradient: 'from-amber-500/10 to-orange-500/10',
        borderColor: 'border-amber-500/20'
      };
    } else {
      return {
        title: 'Account Registration Rejected',
        icon: <XCircle className="h-16 w-16 text-red-500" />,
        message: 'Unfortunately, your registration request has been rejected. Please contact the administrator for support or register a new account.',
        bgGradient: 'from-red-500/10 to-rose-950/20',
        borderColor: 'border-red-500/20'
      };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#12101b] px-4">
      <div className={`max-w-md w-full glass-card p-8 rounded-2xl border text-center ${content.borderColor}`}>
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full bg-gradient-to-tr ${content.bgGradient}`}>
            {content.icon}
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-100 mb-3">{content.title}</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">{content.message}</p>
        
        <div className="space-y-3">
          {user.status === 'PENDING' && (
            <Button
              onClick={handleRecheck}
              loading={checking}
              icon={<RefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              Recheck Status
            </Button>
          )}
          
          <Button
            variant="secondary"
            onClick={handleLogout}
            icon={<LogOut className="h-4 w-4" />}
            className="w-full"
          >
            Logout from Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Approval;

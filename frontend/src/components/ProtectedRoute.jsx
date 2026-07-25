import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ROUTES from '../routes/constants';

export const getDashboardRoute = (role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return ROUTES.SUPER_ADMIN_DASHBOARD;
    case 'COLLEGE_ADMIN':
      return ROUTES.COLLEGE_ADMIN_DASHBOARD;
    case 'VENDOR':
      return ROUTES.VENDOR_DASHBOARD;
    case 'STAFF':
      return ROUTES.STAFF_DASHBOARD;
    case 'USER':
      return ROUTES.USER_DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#12101b]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'USER') {
    if (user.status === 'PENDING' || user.status === 'REJECTED') {
      return <Navigate to={ROUTES.APPROVAL} replace />;
    }
  }

  return children;
};
export default ProtectedRoute;

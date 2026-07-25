import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const getDashboardRoute = (role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/super-admin/dashboard';
    case 'COLLEGE_ADMIN':
      return '/college-admin/dashboard';
    case 'VENDOR':
      return '/vendor/dashboard';
    case 'STAFF':
      return '/staff/dashboard';
    case 'USER':
      return '/user/dashboard';
    default:
      return '/login';
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'USER') {
    if (user.status === 'PENDING' || user.status === 'REJECTED') {
      return <Navigate to="/approval" replace />;
    }
  }

  return children;
};
export default ProtectedRoute;

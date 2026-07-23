import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';

// Layouts
import StudentLayout from '../layouts/StudentLayout';
import VendorLayout from '../layouts/VendorLayout';
import UniAdminLayout from '../layouts/UniAdminLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';

// Dashboards
import StudentDashboard from '../pages/dashboards/StudentDashboard';
import VendorDashboard from '../pages/dashboards/VendorDashboard';
import UniAdminDashboard from '../pages/dashboards/UniAdminDashboard';
import SuperAdminDashboard from '../pages/dashboards/SuperAdminDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
        </Route>
      </Route>

      {/* Vendor Routes */}
      <Route element={<ProtectedRoute allowedRoles={['VENDOR']} />}>
        <Route element={<VendorLayout />}>
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        </Route>
      </Route>

      {/* UniAdmin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['UNIVERSITY_ADMIN']} />}>
        <Route element={<UniAdminLayout />}>
          <Route path="/uni-admin/dashboard" element={<UniAdminDashboard />} />
        </Route>
      </Route>

      {/* SuperAdmin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;

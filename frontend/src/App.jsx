import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ROUTES from './routes/constants';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Approval from './pages/Approval';
import UserDashboard from './pages/UserDashboard';
import VendorDashboard from './pages/VendorDashboard';
import StaffDashboard from './pages/StaffDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CollegeAdminDashboard from './pages/CollegeAdminDashboard';
import NotFound from './pages/NotFound';
import MyShop from './pages/MyShop';
import MenuManagement from './pages/MenuManagement';
import Messages from './pages/Messages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e1b2e',
                color: '#f3f4f6',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
              },
            }}
          />

        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.SIGNUP} element={<Signup />} />
          
          {/* Approval screen */}
          <Route path={ROUTES.APPROVAL} element={<Approval />} />

          {/* Role-based Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            <Route 
              path={ROUTES.USER_DASHBOARD} 
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path={ROUTES.VENDOR_DASHBOARD} 
              element={
                <ProtectedRoute allowedRoles={['VENDOR']}>
                  <VendorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path={ROUTES.MY_SHOP} 
              element={
                <ProtectedRoute allowedRoles={['VENDOR']}>
                  <MyShop />
                </ProtectedRoute>
              } 
            />
            <Route 
              path={ROUTES.MENU_MANAGEMENT} 
              element={
                <ProtectedRoute allowedRoles={['VENDOR']}>
                  <MenuManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path={ROUTES.STAFF_DASHBOARD} 
              element={
                <ProtectedRoute allowedRoles={['STAFF']}>
                  <StaffDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path={ROUTES.COLLEGE_ADMIN_DASHBOARD} 
              element={
                <ProtectedRoute allowedRoles={['COLLEGE_ADMIN']}>
                  <CollegeAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path={ROUTES.SUPER_ADMIN_DASHBOARD} 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path={ROUTES.MESSAGES} 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'VENDOR', 'STAFF']}>
                  <Messages />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch-all route to NotFound */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

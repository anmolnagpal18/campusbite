import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Approval from './pages/Approval';
import UserDashboard from './pages/UserDashboard';
import VendorDashboard from './pages/VendorDashboard';
import StaffDashboard from './pages/StaffDashboard';
import CollegeAdminDashboard from './pages/CollegeAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <path /> {/* React Router needs standard Route structure */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Approval screen */}
          <Route path="/approval" element={<Approval />} />

          {/* Role-based Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            <Route 
              path="/user/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendor/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['VENDOR']}>
                  <VendorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['STAFF']}>
                  <StaffDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/college-admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['COLLEGE_ADMIN']}>
                  <CollegeAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/super-admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

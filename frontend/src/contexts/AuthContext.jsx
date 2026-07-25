import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          await checkAndSetStatus(parsedUser);
        } catch (e) {
          console.error("Failed to initialize auth user", e);
          logout();
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const checkAndSetStatus = async (currentUser) => {
    try {
      let updatedStatus = currentUser.status;
      if (currentUser.role === 'VENDOR') {
        const res = await authService.getVendorStatus();
        updatedStatus = res.status;
      } else if (currentUser.role === 'STAFF') {
        const res = await authService.getStaffStatus();
        updatedStatus = res.status;
      } else if (currentUser.role === 'COLLEGE_ADMIN') {
        const res = await authService.getCollegeAdminStatus();
        updatedStatus = res.status;
      }
      
      if (updatedStatus !== currentUser.status) {
        const updatedUser = { ...currentUser, status: updatedStatus };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
    } catch (err) {
      console.error("Error refreshing status", err);
    }
    return currentUser;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      const { access, refresh, user: userData } = data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      const refreshedUser = await checkAndSetStatus(userData);
      setLoading(false);
      return refreshedUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        await authService.logout(refresh);
      } catch (e) {
        console.error("API logout call failed", e);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setLoading(false);
  };

  const refreshStatus = async () => {
    if (!user) return;
    return await checkAndSetStatus(user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

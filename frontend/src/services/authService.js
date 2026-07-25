import apiClient from '../api/client';

export const authService = {
  // Authentication
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login/', { email, password });
    return response.data;
  },
  
  logout: async (refreshToken) => {
    const response = await apiClient.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  },

  signupUser: async (data) => {
    const response = await apiClient.post('/auth/signup/user/', data);
    return response.data;
  },

  signupVendor: async (data) => {
    const response = await apiClient.post('/auth/signup/vendor/', data);
    return response.data;
  },

  signupStaff: async (data) => {
    const response = await apiClient.post('/auth/signup/staff/', data);
    return response.data;
  },

  signupCollegeAdmin: async (data) => {
    const response = await apiClient.post('/auth/signup/college-admin/', data);
    return response.data;
  },

  // Helpers
  getColleges: async () => {
    const response = await apiClient.get('/colleges/');
    return response.data;
  },

  getVendors: async () => {
    const response = await apiClient.get('/vendors/');
    return response.data;
  },

  // Status checks
  getVendorStatus: async () => {
    const response = await apiClient.get('/vendor/status/');
    return response.data;
  },

  getStaffStatus: async () => {
    const response = await apiClient.get('/staff/status/');
    return response.data;
  },

  getCollegeAdminStatus: async () => {
    const response = await apiClient.get('/college-admin/status/');
    return response.data;
  },

  // Admin Approval lists
  getPendingVendors: async () => {
    const response = await apiClient.get('/vendors/pending/');
    return response.data;
  },

  getPendingStaff: async () => {
    const response = await apiClient.get('/staff/pending/');
    return response.data;
  },

  getPendingCollegeAdmins: async () => {
    const response = await apiClient.get('/college-admin/pending/');
    return response.data;
  },

  // Approval decisions
  approveVendor: async (id) => {
    const response = await apiClient.put(`/vendors/${id}/approve/`);
    return response.data;
  },

  rejectVendor: async (id) => {
    const response = await apiClient.put(`/vendors/${id}/reject/`);
    return response.data;
  },

  approveStaff: async (id) => {
    const response = await apiClient.put(`/staff/${id}/approve/`);
    return response.data;
  },

  rejectStaff: async (id) => {
    const response = await apiClient.put(`/staff/${id}/reject/`);
    return response.data;
  },

  approveCollegeAdmin: async (id) => {
    const response = await apiClient.put(`/college-admin/${id}/approve/`);
    return response.data;
  },

  rejectCollegeAdmin: async (id) => {
    const response = await apiClient.put(`/college-admin/${id}/reject/`);
    return response.data;
  },
};
export default authService;

import apiClient from '../api/client';

export const deactivationService = {
  // Vendor Staff Management
  getStaffList: async () => {
    const response = await apiClient.get('/v1/vendor/staff/');
    return response.data;
  },
  deactivateStaff: async (id) => {
    const response = await apiClient.patch(`/v1/vendor/staff/${id}/deactivate/`);
    return response.data;
  },
  restoreStaff: async (id) => {
    const response = await apiClient.patch(`/v1/vendor/staff/${id}/restore/`);
    return response.data;
  },

  // College Admin Vendor Management
  getVendorsList: async () => {
    const response = await apiClient.get('/v1/college-admin/vendors/');
    return response.data;
  },
  deactivateVendor: async (id) => {
    const response = await apiClient.patch(`/v1/college-admin/vendors/${id}/deactivate/`);
    return response.data;
  },
  restoreVendor: async (id) => {
    const response = await apiClient.patch(`/v1/college-admin/vendors/${id}/restore/`);
    return response.data;
  },

  // Super Admin College Admin Management
  getCollegeAdminsList: async () => {
    const response = await apiClient.get('/v1/super-admin/college-admins/');
    return response.data;
  },
  deactivateCollegeAdmin: async (id) => {
    const response = await apiClient.patch(`/v1/super-admin/college-admins/${id}/deactivate/`);
    return response.data;
  },
  restoreCollegeAdmin: async (id) => {
    const response = await apiClient.patch(`/v1/super-admin/college-admins/${id}/restore/`);
    return response.data;
  },

  // Staff Self-Deactivation
  deactivateSelfStaff: async () => {
    const response = await apiClient.patch('/v1/staff/deactivate/');
    return response.data;
  }
};

export default deactivationService;

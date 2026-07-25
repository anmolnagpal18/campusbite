import apiClient from '../api/client';

export const dashboardService = {
  getSuperAdminStats: async () => {
    const response = await apiClient.get('/v1/dashboard/super-admin/');
    return response.data;
  },

  getCollegeAdminStats: async () => {
    const response = await apiClient.get('/v1/dashboard/college-admin/');
    return response.data;
  },

  getVendorStats: async () => {
    const response = await apiClient.get('/v1/dashboard/vendor/');
    return response.data;
  },

  getStaffStats: async () => {
    const response = await apiClient.get('/v1/dashboard/staff/');
    return response.data;
  },
};
export default dashboardService;

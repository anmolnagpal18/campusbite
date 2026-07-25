import apiClient from '../api/client';

export const collegeService = {
  getColleges: async (page = 1, search = '') => {
    const response = await apiClient.get('/v1/colleges/', {
      params: { page, search }
    });
    return response.data;
  },

  getCollegeAdminStatus: async () => {
    const response = await apiClient.get('/v1/college-admin/status/');
    return response.data;
  },

  getPendingCollegeAdmins: async (page = 1, search = '') => {
    const response = await apiClient.get('/v1/college-admin/pending/', {
      params: { page, search }
    });
    return response.data;
  },

  approveCollegeAdmin: async (id) => {
    const response = await apiClient.put(`/v1/college-admin/${id}/approve/`);
    return response.data;
  },

  rejectCollegeAdmin: async (id) => {
    const response = await apiClient.put(`/v1/college-admin/${id}/reject/`);
    return response.data;
  },
};
export default collegeService;

import apiClient from '../api/client';

export const staffService = {
  getStaffStatus: async () => {
    const response = await apiClient.get('/v1/staff/status/');
    return response.data;
  },

  getPendingStaff: async (page = 1, search = '') => {
    const response = await apiClient.get('/v1/staff/pending/', {
      params: { page, search }
    });
    return response.data;
  },

  approveStaff: async (id) => {
    const response = await apiClient.put(`/v1/staff/${id}/approve/`);
    return response.data;
  },

  rejectStaff: async (id) => {
    const response = await apiClient.put(`/v1/staff/${id}/reject/`);
    return response.data;
  },
};
export default staffService;

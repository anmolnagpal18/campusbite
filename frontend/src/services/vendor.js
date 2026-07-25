import apiClient from '../api/client';

export const vendorService = {
  getVendors: async (page = 1, search = '') => {
    const response = await apiClient.get('/v1/vendors/', {
      params: { page, search }
    });
    return response.data;
  },

  getVendorStatus: async () => {
    const response = await apiClient.get('/v1/vendor/status/');
    return response.data;
  },

  getPendingVendors: async (page = 1, search = '') => {
    const response = await apiClient.get('/v1/vendors/pending/', {
      params: { page, search }
    });
    return response.data;
  },

  approveVendor: async (id) => {
    const response = await apiClient.put(`/v1/vendors/${id}/approve/`);
    return response.data;
  },

  rejectVendor: async (id) => {
    const response = await apiClient.put(`/v1/vendors/${id}/reject/`);
    return response.data;
  },
};
export default vendorService;

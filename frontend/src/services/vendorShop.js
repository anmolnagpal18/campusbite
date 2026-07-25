import apiClient from '../api/client';

export const vendorShopService = {
  getShopDetails: async () => {
    const response = await apiClient.get('/v1/vendor/shop/');
    return response.data;
  },

  updateShopDetails: async (data) => {
    const response = await apiClient.put('/v1/vendor/shop/', data);
    return response.data;
  }
};
export default vendorShopService;

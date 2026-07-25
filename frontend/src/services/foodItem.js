import apiClient from '../api/client';

export const foodItemService = {
  getFoodItems: async (page = 1, search = '', categoryId = '', availability = '', pageSize = 10) => {
    const params = { page, search, page_size: pageSize };
    if (categoryId) params.category = categoryId;
    if (availability) params.availability = availability;
    const response = await apiClient.get('/v1/vendor/items/', { params });
    return response.data;
  },

  createFoodItem: async (formData) => {
    const response = await apiClient.post('/v1/vendor/items/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  updateFoodItem: async (id, formData) => {
    const response = await apiClient.put(`/v1/vendor/items/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteFoodItem: async (id) => {
    const response = await apiClient.delete(`/v1/vendor/items/${id}/`);
    return response.data;
  },

  bulkOperations: async (data) => {
    const response = await apiClient.post('/v1/vendor/items/bulk/', data);
    return response.data;
  },

  reorderFoodItems: async (data) => {
    const response = await apiClient.post('/v1/vendor/items/reorder/', data);
    return response.data;
  }
};
export default foodItemService;

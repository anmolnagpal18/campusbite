import apiClient from '../api/client';

export const categoryService = {
  getCategories: async (page = 1, search = '') => {
    const response = await apiClient.get('/v1/vendor/categories/', {
      params: { page, search }
    });
    return response.data;
  },

  createCategory: async (data) => {
    const response = await apiClient.post('/v1/vendor/categories/', data);
    return response.data;
  },

  updateCategory: async (id, data) => {
    const response = await apiClient.put(`/v1/vendor/categories/${id}/`, data);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/v1/vendor/categories/${id}/`);
    return response.data;
  }
};
export default categoryService;

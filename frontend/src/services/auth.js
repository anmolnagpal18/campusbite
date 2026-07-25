import apiClient from '../api/client';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/v1/auth/login/', { email, password });
    return response.data;
  },
  
  logout: async (refreshToken) => {
    const response = await apiClient.post('/v1/auth/logout/', { refresh: refreshToken });
    return response.data;
  },

  signupUser: async (data) => {
    const response = await apiClient.post('/v1/auth/signup/user/', data);
    return response.data;
  },

  signupVendor: async (data) => {
    const response = await apiClient.post('/v1/auth/signup/vendor/', data);
    return response.data;
  },

  signupStaff: async (data) => {
    const response = await apiClient.post('/v1/auth/signup/staff/', data);
    return response.data;
  },

  signupCollegeAdmin: async (data) => {
    const response = await apiClient.post('/v1/auth/signup/college-admin/', data);
    return response.data;
  },
};
export default authService;

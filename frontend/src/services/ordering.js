import apiClient from '../api/client';

export const orderingService = {
  // Colleges, Areas, Blocks, Restaurants
  getColleges: async () => {
    const response = await apiClient.get('/v1/user/colleges/');
    return response.data;
  },

  getAreas: async (collegeId) => {
    const response = await apiClient.get('/v1/user/areas/', {
      params: { college_id: collegeId }
    });
    return response.data;
  },

  getBlocks: async (collegeId, area) => {
    const response = await apiClient.get('/v1/user/blocks/', {
      params: { college_id: collegeId, area }
    });
    return response.data;
  },

  getRestaurants: async (collegeId, area, block) => {
    const response = await apiClient.get('/v1/user/restaurants/', {
      params: { college_id: collegeId, area, block }
    });
    return response.data;
  },

  getRestaurantDetail: async (id) => {
    const response = await apiClient.get(`/v1/user/restaurants/${id}/`);
    return response.data;
  },

  // Cart
  getCart: async () => {
    const response = await apiClient.get('/v1/cart/');
    return response.data;
  },

  addToCart: async (foodItemId, quantity = 1) => {
    const response = await apiClient.post('/v1/cart/', {
      food_item_id: foodItemId,
      quantity
    });
    return response.data;
  },

  updateCartItem: async (itemId, quantity) => {
    const response = await apiClient.put('/v1/cart/', {
      item_id: itemId,
      quantity
    });
    return response.data;
  },

  deleteCartItem: async (itemId) => {
    const response = await apiClient.delete(`/v1/cart/item/${itemId}/`);
    return response.data;
  },

  clearCart: async () => {
    const response = await apiClient.delete('/v1/cart/');
    return response.data;
  },

  // Checkout
  checkout: async (orderType, pickupTime = null) => {
    const response = await apiClient.post('/v1/checkout/', {
      order_type: orderType,
      pickup_time: pickupTime
    });
    return response.data;
  },

  // Orders
  getOrders: async (statusFilter = '') => {
    const response = await apiClient.get('/v1/orders/', {
      params: statusFilter ? { status: statusFilter } : {}
    });
    return response.data;
  },

  getOrderDetail: async (id) => {
    const response = await apiClient.get(`/v1/orders/${id}/`);
    return response.data;
  },

  updateOrderStatus: async (orderId, status, cancelReason = '') => {
    const response = await apiClient.put('/v1/orders/status/', {
      order_id: orderId,
      status,
      cancel_reason: cancelReason
    });
    return response.data;
  },

  // QR scan
  scanQR: async (token, orderUuid, qrImageFile = null) => {
    if (qrImageFile) {
      const formData = new FormData();
      formData.append('token', token || '');
      formData.append('order_uuid', orderUuid || '');
      formData.append('qr_image', qrImageFile);
      const response = await apiClient.post('/v1/scan-qr/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } else {
      const response = await apiClient.post('/v1/scan-qr/', {
        token,
        order_uuid: orderUuid
      });
      return response.data;
    }
  },

  // Notifications
  getNotifications: async (unreadOnly = false) => {
    const response = await apiClient.get('/v1/notifications/', {
      params: unreadOnly ? { unread: 'true' } : {}
    });
    return response.data;
  },

  markNotificationsRead: async () => {
    const response = await apiClient.put('/v1/notifications/read/');
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await apiClient.delete(`/v1/notifications/${id}/`);
    return response.data;
  }
};

export default orderingService;

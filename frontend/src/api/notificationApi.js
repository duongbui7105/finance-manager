import api from './axios';

export const notificationApi = {
  // Get all notifications for current user
  getAll: () => api.get('/notifications'),

  // Get unread count
  getUnreadCount: () => api.get('/notifications/unread-count'),

  // Mark a notification as read
  markRead: (id) => api.put(`/notifications/${id}/read`),

  // Mark all as read
  markAllRead: () => api.put('/notifications/read-all'),

  // Delete a notification
  delete: (id) => api.delete(`/notifications/${id}`),

  // Delete all notifications
  deleteAll: () => api.delete('/notifications'),
};

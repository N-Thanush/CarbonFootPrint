const API_BASE_URL = 'http://localhost:8080/api';

/**
 * API service for communicating with the Spring Boot backend.
 */

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.message || data.error || 'Something went wrong';
    const error = new Error(errorMsg);
    error.data = data;
    error.status = response.status;
    throw error;
  }
  return data;
}

export const authApi = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  setPassword: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  forgotPassword: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  resetPassword: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/auth/upload-document`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  getProfile: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  changePassword: async (token, payload) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
};

/**
 * Admin API — requires ADMIN JWT token.
 */
export const adminApi = {
  // Users
  getUsers: async (token, { status = 'ALL', page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams({ status, page: String(page), size: String(size) });
    const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  approveUser: async (token, userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  rejectUser: async (token, userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  deleteUser: async (token, userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // Activity Categories
  getCategories: async (token, { page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await fetch(`${API_BASE_URL}/admin/categories?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  createCategory: async (token, data) => {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateCategory: async (token, id, data) => {
    const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteCategory: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  // Activity Types
  getActivityTypes: async (token, { categoryId, page = 0, size = 10 } = {}) => {
    const p = { page: String(page), size: String(size) };
    if (categoryId) p.categoryId = String(categoryId);
    const params = new URLSearchParams(p);
    const response = await fetch(`${API_BASE_URL}/admin/activity-types?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  createActivityType: async (token, data) => {
    const response = await fetch(`${API_BASE_URL}/admin/activity-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateActivityType: async (token, id, data) => {
    const response = await fetch(`${API_BASE_URL}/admin/activity-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteActivityType: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/admin/activity-types/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  // Emission Factors
  getEmissionFactors: async (token, { activityTypeId, page = 0, size = 10 } = {}) => {
    const p = { page: String(page), size: String(size) };
    if (activityTypeId) p.activityTypeId = String(activityTypeId);
    const params = new URLSearchParams(p);
    const response = await fetch(`${API_BASE_URL}/admin/emission-factors?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  createEmissionFactor: async (token, data) => {
    const response = await fetch(`${API_BASE_URL}/admin/emission-factors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateEmissionFactor: async (token, id, data) => {
    const response = await fetch(`${API_BASE_URL}/admin/emission-factors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteEmissionFactor: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/admin/emission-factors/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },
};

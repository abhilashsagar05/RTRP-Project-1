const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const getHeaders = () => {
  const token = localStorage.getItem('sphn_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const getAuthHeader = () => {
  const token = localStorage.getItem('sphn_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Safely parse JSON responses — prevents "Unexpected end of JSON input" crashes
const handleResponse = async (res) => {
  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`Server error (${res.status})`);
    return {};
  }
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  } catch (e) {
    if (e.message && !e.message.includes('JSON')) throw e; // re-throw API errors
    throw new Error(`Server returned invalid response (${res.status})`);
  }
};

// ---- Auth ----
export const authAPI = {
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(handleResponse),

  register: (name, email, password) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }).then(handleResponse)
};

// ---- Reports ----
export const reportsAPI = {
  create: (formData) =>
    fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    }).then(handleResponse),

  getMyReports: (page = 1, limit = 10) =>
    fetch(`${API_BASE}/reports/my?page=${page}&limit=${limit}`, {
      headers: getHeaders()
    }).then(handleResponse),

  getReport: (id) =>
    fetch(`${API_BASE}/reports/${id}`, {
      headers: getHeaders()
    }).then(handleResponse)
};

// ---- Admin ----
export const adminAPI = {
  getReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/admin/reports?${query}`, {
      headers: getHeaders()
    }).then(handleResponse);
  },

  updateReport: (id, data) =>
    fetch(`${API_BASE}/admin/reports/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  deleteReport: (id) =>
    fetch(`${API_BASE}/admin/reports/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse),

  getUsers: (page = 1) =>
    fetch(`${API_BASE}/admin/users?page=${page}`, {
      headers: getHeaders()
    }).then(handleResponse),

  deleteUser: (id) =>
    fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse),

  toggleBanUser: (id) =>
    fetch(`${API_BASE}/admin/users/${id}/ban`, {
      method: 'PATCH',
      headers: getHeaders()
    }).then(handleResponse),

  registerPolice: (name, email, password) =>
    fetch(`${API_BASE}/admin/register-police`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password })
    }).then(handleResponse),

  registerAdmin: (name, email, password) =>
    fetch(`${API_BASE}/admin/register-admin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password })
    }).then(handleResponse),

  registerUser: (name, email, password) =>
    fetch(`${API_BASE}/admin/register-user`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password })
    }).then(handleResponse)
};

// ---- Analytics ----
export const analyticsAPI = {
  getSummary: () =>
    fetch(`${API_BASE}/analytics/summary`, {
      headers: getHeaders()
    }).then(handleResponse),

  getHeatmap: () =>
    fetch(`${API_BASE}/analytics/heatmap`, {
      headers: getHeaders()
    }).then(handleResponse),

  getAreas: () =>
    fetch(`${API_BASE}/analytics/areas`, {
      headers: getHeaders()
    }).then(handleResponse)
};


/**
 * API Client — Fetch wrapper with JWT interceptor
 * 
 * Handles:
 * - Automatic Authorization header injection
 * - Auto-refresh on 401 responses
 * - Consistent error response format
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/** Get stored tokens */
function getTokens() {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}

/** Store tokens */
export function setTokens(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

/** Clear tokens */
export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

/** Check if user has tokens */
export function hasTokens() {
  return !!localStorage.getItem('accessToken');
}

/**
 * Core fetch wrapper with auth handling.
 */
async function request(endpoint, options = {}) {
  const { accessToken } = getTokens();

  const config = {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  };

  // If body is object (not FormData), stringify it
  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  let response = await fetch(`${API_BASE}${endpoint}`, config);

  // If 401 and we have a refresh token, try refreshing
  if (response.status === 401 && getTokens().refreshToken) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry original request with new token
      const { accessToken: newToken } = getTokens();
      config.headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}${endpoint}`, config);
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/** Attempt to refresh the access token */
async function tryRefreshToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    setTokens(data.data.accessToken, data.data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ─── Auth API ──────────────────────────────────────────────

export const authAPI = {
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  profile: () => request('/auth/profile'),
};

// ─── Resume API ────────────────────────────────────────────

export const resumeAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return request('/resume/upload', { method: 'POST', body: formData });
  },

  jobMatch: (file, jobDescription) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);
    return request('/resume/job-match', { method: 'POST', body: formData });
  },

  getStatus: (jobId) => request(`/resume/status/${jobId}`),

  getResult: (id) => request(`/resume/result/${id}`),

  getHistory: (page = 1, limit = 10) =>
    request(`/resume/history?page=${page}&limit=${limit}`),

  deleteAnalysis: (id) => request(`/resume/${id}`, { method: 'DELETE' }),
};

// ─── Subscription API ──────────────────────────────────────

export const subscriptionAPI = {
  getStatus: () => request('/subscription/status'),

  createCheckout: (plan) =>
    request('/subscription/checkout', { method: 'POST', body: { plan } }),

  createPortal: () =>
    request('/subscription/portal', { method: 'POST' }),
};

// ─── LinkedIn API ──────────────────────────────────────────

export const linkedinAPI = {
  analyzeProfile: (profileText) =>
    request('/linkedin/analyze', { method: 'POST', body: { profileText } }),

  generateResume: (profileText, targetRole) =>
    request('/linkedin/generate-resume', { method: 'POST', body: { profileText, targetRole } }),
};

// ─── Image API ─────────────────────────────────────────────

export const imageAPI = {
  generateHeadshot: (options) =>
    request('/images/headshot', { method: 'POST', body: options }),

  generateCoverPhoto: (options) =>
    request('/images/cover', { method: 'POST', body: options }),
};

export default request;


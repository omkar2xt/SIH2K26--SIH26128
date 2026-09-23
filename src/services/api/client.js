const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Standardized API client for PASHU-RAKSHA.
 * Handles JWT attachment and error normalization.
 */
export async function apiClient(endpoint, options = {}) {
  const token = localStorage.getItem('pashuraksha_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, data: null };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: data?.error?.message || data?.error || 'Unknown API Error'
      };
    }

    return { success: true, data };
  } catch (error) {
    // Network failure
    return {
      success: false,
      status: 0,
      error: 'Backend Unavailable'
    };
  }
}

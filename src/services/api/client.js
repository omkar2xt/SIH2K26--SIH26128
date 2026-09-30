const configuredBase = import.meta.env.VITE_API_URL;
const API_BASE_URL = configuredBase
  ? configuredBase.replace(/\/$/, '')
  : (typeof window !== 'undefined' && window.location.port === '5173' ? '/api' : 'http://localhost:3000/api');

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

    const isDemoActive = parseInt(localStorage.getItem('pashuraksha_sim_step') || '0', 10) > 0 || localStorage.getItem('pashuraksha_sim_running') === 'true';
    if (!isDemoActive && (!options.method || options.method === 'GET')) {
      const demoEndpoints = ['/animals', '/observations', '/alerts', '/cases', '/lab/orders', '/vaccinations', '/epidemiology', '/gis', '/health-fingerprint'];
      // Let reference data through
      if (demoEndpoints.some(e => endpoint.startsWith(e)) && !endpoint.includes('/reference')) {
        let emptyData = [];
        if (endpoint.includes('/health-fingerprint')) emptyData = null;
        else if (endpoint.includes('/vaccinations/stats')) emptyData = { total: 0, upToDate: 0, dueSoon: 0, overdue: 0 };
        else if (endpoint.includes('/gis/map-data')) emptyData = { animals: [], farms: [], clusters: [], containmentZones: [] };
        return { success: true, data: emptyData };
      }
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, data: null };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('pashuraksha_token');
        localStorage.removeItem('pashuraksha_role');
        localStorage.removeItem('pashuraksha_username');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pashuraksha_auth_expired'));
        }
      }
      return {
        success: false,
        status: response.status,
        error: data?.error?.message || data?.error || 'Unknown API Error'
      };
    }

    // If backend already wrapped it in success/data, return it as-is
    if (data && typeof data === 'object' && 'success' in data) {
      return data;
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

apiClient.get = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'GET' });
apiClient.post = (endpoint, data, options = {}) => apiClient(endpoint, {
  ...options,
  method: 'POST',
  body: data !== undefined ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined
});
apiClient.put = (endpoint, data, options = {}) => apiClient(endpoint, {
  ...options,
  method: 'PUT',
  body: data !== undefined ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined
});
apiClient.delete = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'DELETE' });


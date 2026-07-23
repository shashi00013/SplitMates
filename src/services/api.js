// ============================================================
// CENTRALIZED API CLIENT LAYER
// Handles base URL, auth tokens, JSON request formatting, and error handling
// ============================================================

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL;
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  return 'http://localhost:5000/api';
};

class ApiClient {
  getToken() {
    return localStorage.getItem('splitly_token') || localStorage.getItem('token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('splitly_token', token);
    } else {
      localStorage.removeItem('splitly_token');
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const method = (options.method || 'GET').toUpperCase();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${getBaseUrl()}${cleanEndpoint}`;

    // 10-second timeout via AbortController
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs || 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config = {
      ...options,
      headers,
      signal: controller.signal,
    };

    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    console.log(`[API START] ${method} ${url}`);

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

      if (response.status === 401) {
        // Expired token or unauthorized request
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          response.status === 429
            ? 'Too many requests. Please slow down and try again shortly.'
            : errorData.message || errorData.error || `API Error (${response.status})`;
        console.error(`[API ERROR] ${method} ${url} (Status ${response.status}, ${duration.toFixed(1)}ms): ${errorMessage}`);
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      console.log(`[API SUCCESS] ${method} ${url} (${duration.toFixed(1)}ms)`);

      if (response.status === 204) return null;

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

      if (error.name === 'AbortError') {
        console.error(`[API TIMEOUT] ${method} ${url} (Timed out after ${timeoutMs}ms)`);
        const timeoutErr = new Error(`Request timed out. Server at ${getBaseUrl()} did not respond within ${timeoutMs / 1000}s.`);
        timeoutErr.status = 408;
        throw timeoutErr;
      }

      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        console.error(`[API ERROR] ${method} ${url} (Network Connection Error, ${duration.toFixed(1)}ms): Unable to connect`);
        const netErr = new Error(
          `Unable to connect to backend server at ${getBaseUrl()}. Please ensure the API backend service is running.`
        );
        netErr.status = 0;
        throw netErr;
      }

      throw error;
    }
  }

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options) {
    return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) });
  }

  put(endpoint, data, options) {
    return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) });
  }

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();

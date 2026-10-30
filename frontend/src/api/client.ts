const API_BASE = '/api/v1';

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('cybersentinel_token');
  }

  static setToken(token: string) {
    localStorage.setItem('cybersentinel_token', token);
  }

  static clearToken() {
    localStorage.removeItem('cybersentinel_token');
    localStorage.removeItem('cybersentinel_user');
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Network request failed' }));
      throw new Error(err.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }

    return response.json();
  }
}

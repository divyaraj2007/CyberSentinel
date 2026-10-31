// Smart API Client with auto-failover between Apache reverse-proxy and direct backend port 8000

let activeApiBase: string | null = null;

const getCandidateBases = (): string[] => {
  const isXampp = typeof window !== 'undefined' && window.location.pathname.startsWith('/cybersentinel');
  
  const candidates: string[] = [];
  
  // 1. Remembered working base
  const saved = typeof window !== 'undefined' ? localStorage.getItem('cybersentinel_api_base') : null;
  if (saved) {
    candidates.push(saved);
  }

  // 2. Direct backend ports (fastest and bypasses any Apache proxy issues)
  candidates.push('http://127.0.0.1:8000/api/v1');
  candidates.push('http://localhost:8000/api/v1');

  // 3. Environment reverse-proxy base
  if (isXampp) {
    candidates.push('/cybersentinel/api/v1');
  }
  candidates.push('/api/v1');

  // Deduplicate
  return Array.from(new Set(candidates));
};

export class ApiClient {
  static getToken(): string | null {
    return localStorage.getItem('cybersentinel_token');
  }

  static setToken(token: string): void {
    localStorage.setItem('cybersentinel_token', token);
  }

  static clearToken(): void {
    localStorage.removeItem('cybersentinel_token');
    localStorage.removeItem('cybersentinel_user');
  }

  static getApiUrl(): string {
    return activeApiBase || getCandidateBases()[0];
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const candidateBases = activeApiBase ? [activeApiBase, ...getCandidateBases().filter(b => b !== activeApiBase)] : getCandidateBases();
    let lastError: any = null;

    for (const base of candidateBases) {
      try {
        const url = `${base}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // If status is 404/500/502 and response is HTML (Apache error page), this proxy is misconfigured, try next candidate
        const contentType = response.headers.get('content-type') || '';
        if ((response.status === 404 || response.status === 502 || response.status === 500) && contentType.includes('text/html')) {
          lastError = new Error(`Proxy error on ${base}`);
          continue; // Try next candidate base (e.g. direct http://127.0.0.1:8000/api/v1)
        }

        if (response.status === 401) {
          this.clearToken();
          if (!window.location.pathname.includes('/login')) {
            const loginPath = window.location.pathname.startsWith('/cybersentinel') ? '/cybersentinel/login' : '/login';
            window.location.href = loginPath;
          }
          throw new Error('Unauthorized');
        }

        if (!response.ok) {
          let errorDetail = `Request failed with status ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.detail) {
              errorDetail = errData.detail;
            }
          } catch {
            // Not json
          }
          throw new Error(errorDetail);
        }

        // Success! Remember this working base
        activeApiBase = base;
        try {
          localStorage.setItem('cybersentinel_api_base', base);
        } catch {}

        return response.json();
      } catch (err: any) {
        lastError = err;
        if (err.message === 'Unauthorized') {
          throw err;
        }
        // If network failed (e.g. proxy offline), loop to next candidate
      }
    }

    if (lastError && (lastError.name === 'TypeError' || lastError.message === 'Failed to fetch')) {
      throw new Error('Backend server is unreachable (http://127.0.0.1:8000). Please start the Python backend.');
    }

    throw lastError || new Error('Backend service unreachable. Please ensure the CyberSentinel backend is running on port 8000.');
  }

  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const candidateBases = activeApiBase ? [activeApiBase, ...getCandidateBases().filter(b => b !== activeApiBase)] : getCandidateBases();
    let lastError: any = null;

    for (const base of candidateBases) {
      try {
        const response = await fetch(`${base}${endpoint}`, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
          throw new Error(err.detail || 'Upload failed');
        }

        activeApiBase = base;
        return response.json();
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Upload failed. Please ensure the CyberSentinel backend is running on port 8000.');
  }
}

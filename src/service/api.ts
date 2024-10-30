interface ApiClientConfig {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string>;
  timeout?: number;
  requiresAuth?: boolean;
  body? : any;
}

// Custom error class for API errors
class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private authToken: string | null = null;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
    this.defaultTimeout = config.timeout || 10000;
  }

  // Set auth token
  public setAuthToken(token: string): void {
    this.authToken = token;
  }

  // Clear auth token
  public clearAuthToken(): void {
    this.authToken = null;
  }

  // Helper to build URL with query parameters
  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseURL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  // Helper to handle timeouts
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timed out after ${ms}ms`));
      }, ms);
    });
  }

  // Helper to process response
  private async processResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, data);
    }

    return data as T;
  }

  // Generic request method
  private async request<T>(
    path: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      params,
      timeout = this.defaultTimeout,
      requiresAuth = false,
      headers = {},
      body,
      ...fetchConfig
    } = config;
  
    // Prepare headers
    const requestHeaders = new Headers(this.defaultHeaders);
    Object.entries(headers).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });
  
    // Add auth token if required
    if (requiresAuth && this.authToken) {
      requestHeaders.set('Authorization', `Bearer ${this.authToken}`);
    }
  
    // Prepare fetch config
    const requestConfig: RequestInit = {
      ...fetchConfig,
      headers: requestHeaders,
    };
  
    // Handle different body types
    if (body !== undefined) {
      if (body instanceof FormData) {
        // For FormData, remove Content-Type header to let browser set it with boundary
        requestHeaders.delete('Content-Type');
        requestConfig.body = body;
      } else if (body instanceof URLSearchParams) {
        requestHeaders.set('Content-Type', 'application/x-www-form-urlencoded');
        requestConfig.body = body;
      } else if (body instanceof Blob || body instanceof ArrayBuffer) {
        requestConfig.body = body;
      } else if (typeof body === 'object') {
        requestHeaders.set('Content-Type', 'application/json');
        requestConfig.body = JSON.stringify(body);
      } else {
        // For primitive types
        requestConfig.body = String(body);
      }
    }
  
    try {
      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(this.buildUrl(path, params), requestConfig),
        this.timeout(timeout),
      ]);
  
      return await this.processResponse<T>(response as Response);
    } catch (error) {
      if (error instanceof ApiError) {
        this.handleApiError(error);
      }
      throw error;
    }
  }
  

  // GET request
  public async get<T>(
    path: string,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: 'GET',
    });
  }

  // POST request
  public async post<T>(
    path: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  public async put<T>(
    path: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: 'PUT',
      body: data,
    });
  }

  // PATCH request
  public async patch<T>(
    path: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: 'PATCH',
      body: data,
    });
  }

  // DELETE request
  public async delete<T>(
    path: string,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: 'DELETE',
    });
  }

  // Error handler
  private handleApiError(error: ApiError): void {
    switch (error.status) {
      case 401:
        this.clearAuthToken();
        // Add custom unauthorized handling logic here
        console.error('Unauthorized request');
        break;
      case 404:
        console.error('Resource not found');
        break;
      case 500:
        console.error('Internal server error');
        break;
      default:
        console.error(`API Error: ${error.status} ${error.statusText}`);
    }
  }
}
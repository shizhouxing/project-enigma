export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: {
    detail?: string;
  };
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  status?: number,
  statusText?: string,
  error?: {
    detail?: string;
  };
}
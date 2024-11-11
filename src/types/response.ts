export interface ActionResponse {
  ok: boolean;
  status?: number;
  message?: string;
}

export interface Message {
  status?: number;
  message?: string;
  data?: any;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

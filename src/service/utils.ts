export interface HandleErrorResponse{
  ok? : boolean;
  status? : number;
  data? : any;
  message? : string;
  error? : string
}

export async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        data: error,
        message: error.detail || "An error occurred",

      };
    }
    return response.json();
  }
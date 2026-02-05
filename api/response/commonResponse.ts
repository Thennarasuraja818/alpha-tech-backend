export interface SuccessResponse<T> {
  status: 'success';
  message: string;
  statusCode: string | number;
  data: T;
}
export type ApiResponse<T> = SuccessResponse<T>

export interface SuccessMessage {
  message: string
}

// Re-export ErrorResponse for unified imports
export { ErrorResponse } from "./cmmonerror";
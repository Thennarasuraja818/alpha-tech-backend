import { ErrorResponse } from "../../api/response/cmmonerror";

// Custom API Error class for handleErrorResponse
export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
  toResponse() {
    return { status: 'error', message: this.message, statusCode: this.statusCode };
  }
}

export default ApiError;

// Function to generate raw error response objects
export function createErrorResponse(
  message: string,
  errorCode: string | number,
  errorDetails?: string,
  statusCode?: number
): ErrorResponse {
  
  return {
    statusCode:errorCode,
    status: 'error',
    message,
    errorCode,
    errorDetails,
  };
}
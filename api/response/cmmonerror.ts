export interface ErrorResponse {
    statusCode: any;
    status: 'error';
    message: string;
    errorCode: string | number;
    errorDetails?: string;  // Optional field for more detailed error information
  }
  
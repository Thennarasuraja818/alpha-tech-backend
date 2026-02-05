import { string } from "zod";
import { ApiResponse, SuccessResponse } from "../../api/response/commonResponse";
import {Response} from 'express'
import { ErrorResponse } from "../../api/response/cmmonerror";
import { PaginationResult } from "../../api/response/paginationResponse";
import { StatusCodes } from "http-status-codes";

export function successResponse<T>(message: string,statusCode:  string | number,data: T): SuccessResponse<T> {
    return {
      status: 'success',
      statusCode:statusCode,
      message,
      data,
    };
  }


export async function sendErrorResponse(res: Response, statusCode: number, message: string, errorCode: string, errors?: any) {
          return res.status(statusCode).json({
              status: 'error',
              message,
              statusCode,
              errorCode,
              ...(errors && { errors })
          });
}
  
export async function sendResponse<T>(res: Response, response: ApiResponse<T> | ErrorResponse) {
          if ('status' in response && response.status === 'error') {
              return res.status(response.statusCode).json(response);
          }
          return res.status(Number(response.statusCode)).json(response);
}

export async function sendPaginationResponse<T>(res: Response, response: PaginationResult<T> | ErrorResponse) {
  const isError = (resp: any): resp is ErrorResponse => 'errorCode' in resp;
  if (isError(response)) {
      return res.status(response.statusCode).json(response);
  }
  return res.status(StatusCodes.OK).json(response);
}
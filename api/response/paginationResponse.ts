import { StatusCodes } from "http-status-codes";
import { createErrorResponse } from "../../utils/common/errors";

export interface PaginationResult<T> {
  status: number | string;
  message: string;
  totalCount?: number;
  from?: number;
  to?: number;
  totalPages?: number;
  currentPage?: number;
  data?: T[];
}

function Pagination<T>(
  totalCount: number,
  data: T[],
  limit: number,
  currentPage: number
): PaginationResult<T> | any {
  try {
    const offset = (+currentPage + 1 - 1) * limit;
    let from = 0;
    let to = 0;
    if (totalCount > 0) {
      from = offset + 1;
      to = offset + limit > totalCount ? totalCount : offset + limit;
    }

    return {
      status: StatusCodes.OK,
      message: "Pagination successful",
      from,
      to,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: +currentPage + 1,
      data,
    };
  } catch (error: any) {
    return createErrorResponse(
      "Error retrieving brand details",
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
}

export default Pagination;

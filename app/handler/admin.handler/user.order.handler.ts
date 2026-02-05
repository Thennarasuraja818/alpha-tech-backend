import { Request, Response } from "express";
import { UserRoleServiceDomain } from "../../../domain/admin/userRoleDomain";
import { CreateUserRoleInput, createUserRoleSchema } from "../../../api/Request/userRole";
import { StatusCodes } from "http-status-codes";
import { UserOrderDomainService } from "../../../domain/admin/user.orderDomain";
import { sendErrorResponse, sendPaginationResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";

export class UserOrderHandler {

  private service: UserOrderDomainService;

  constructor(userOrderService: UserOrderDomainService) {
    this.service = userOrderService;
  }

  list = async (req: Request, res: Response): Promise<any> => {
    try {
      const userId = req.query.userId as string || '';
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 0;
      const type = req.query.type as string || 'wholesaler';
      const orderStatus = req.query.orderStatus as string || '';
      if (!userId || !Types.ObjectId.isValid(userId)) {
        return sendErrorResponse(
          res,
          StatusCodes.UNAUTHORIZED,
          'User Id required',
          'User Id required'
        );
      }
      const result = await this.service.list({ page, limit, type, userId, orderStatus });
      sendPaginationResponse(res, result);
    } catch (err: any) {
      sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR',
        err.message
      );
    }
  };
};




export function UserOrderHandlerFun(service: UserOrderDomainService): UserOrderHandler {

  return new UserOrderHandler(service);
}
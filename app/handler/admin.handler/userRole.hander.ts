import { Request, Response } from "express";
import { UserRoleServiceDomain } from "../../../domain/admin/userRoleDomain";
import { CreateUserRoleInput, createUserRoleSchema } from "../../../api/Request/userRole";
import { StatusCodes } from "http-status-codes";

export class UserRoleHandler {


  private userRoleService: UserRoleServiceDomain;

  constructor(userRoleService: UserRoleServiceDomain) {
    this.userRoleService = userRoleService;
  }

  createUserRole = async (req: Request, res: Response): Promise<any> => {
    try {
      const result = createUserRoleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;

      const userRoleData: CreateUserRoleInput = {
        ...result.data,
        createdBy: userId,
        modifiedBy: userId,
      };

      const response = await this.userRoleService.createUserRole(userRoleData);
      res.status(StatusCodes.OK).json(response);

    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  getAllUserRole = async (req: Request, res: Response) => {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 0,
        limit: parseInt(req.query.limit as string) || 50,
        search: req.query.search ? String(req.query.search) : undefined
      };

      const roles = await this.userRoleService.getAllUserRole(params);
      res.status(StatusCodes.OK).json(roles);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  getUserRoleById = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const role = await this.userRoleService.getUserRoleById(id);
      ;
      if (!role) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
      }

      res.status(StatusCodes.OK).json(role);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  updateUserRole = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const result = createUserRoleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;
      const userData = {
        ...result.data,
        modifiedBy: userId
      };

      const response = await this.userRoleService.updateUserRole(id, userData);
      res.status(response.statusCode as number).json(response);
    } catch (err: any) {

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  deleteUserRole = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const result = createUserRoleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;
      const userData = {
        ...result.data,
        modifiedBy: userId,
        isDelete: true
      };

      const response = await this.userRoleService.updateUserRole(id, userData);
      res.status(response.statusCode as number).json(response);
    } catch (err: any) {

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
};




export function UserRoleHandlerFun(service: UserRoleServiceDomain): UserRoleHandler {

  return new UserRoleHandler(service);
}
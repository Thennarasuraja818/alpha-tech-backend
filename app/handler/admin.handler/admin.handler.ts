import { Request, Response } from "express";
import { AdminServiceDomain } from "../../../domain/admin/adminDomain";
import { createAdminSchema, loginAdminSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, CreateAdminInput, LoginAdminInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput, changePasswordByUserIdSchema } from "../../../api/Request/admin";
import { StatusCodes } from "http-status-codes";

export class AdminUserHandler {
  private userService: AdminServiceDomain;

  constructor(userService: AdminServiceDomain) {
    this.userService = userService;
  }

  createAdminUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = createAdminSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      }
      const data: CreateAdminInput = parsed.data;
      const result = await this.userService.createAdmin(data);
      if (result.status === "error") {
        return res.status(StatusCodes.BAD_REQUEST).json(result);
      }
      return res.status(StatusCodes.CREATED).json(result);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  loginAdminUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = loginAdminSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      }
      const data: LoginAdminInput = parsed.data;
      const result = await this.userService.loginAdmin(data);
      if (result.status === "error") {
        return res.status(StatusCodes.UNAUTHORIZED).json(result);
      }
      return res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  getAdminProfile = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const result = await this.userService.getProfile(id);
      if (result.status === "error") {
        return res.status(StatusCodes.NOT_FOUND).json(result);
      }
      return res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  // Send password reset email with token
  forgotPassword = async (req: Request, res: Response): Promise<any> => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
    }
    const result = await this.userService.forgotPassword(parsed.data as ForgotPasswordInput);
    return res.status(result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.OK).json(result);
  };

  // Reset password using token
  resetPassword = async (req: Request, res: Response): Promise<any> => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
    }
    const result = await this.userService.resetPassword(parsed.data as ResetPasswordInput);
    return res.status(result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.OK).json(result);
  };

  // Change password when logged in
  changePassword = async (req: Request & { user: any }, res: Response): Promise<any> => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
    }
    const userId = req.user.id;
    const result = await this.userService.changePassword(userId, parsed.data as ChangePasswordInput);
    return res.status(result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.OK).json(result);
  };
  checkMobileNumber = async (req: Request, res: Response): Promise<any> => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Phone number is required"
        });
      }

      const result = await this.userService.checkMobileNumber(phoneNumber);

      if (result.status === "error") {
        return res.status(StatusCodes.BAD_REQUEST).json(result);
      }

      return res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: err.message
      });
    }
  };
  changePasswordByUserId = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = changePasswordByUserIdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      }

      const { userId, newPassword } = parsed.data;

      const result = await this.userService.changePasswordByUserId(userId, newPassword);

      return res.status(result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.OK).json(result);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: err.message
      });
    }
  };
}

export function AdminUserHandlerFun(service: AdminServiceDomain): AdminUserHandler {
  return new AdminUserHandler(service);
}
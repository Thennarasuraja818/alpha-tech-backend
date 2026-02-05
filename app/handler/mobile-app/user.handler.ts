import { Request, Response } from "express";

import { StatusCodes } from "http-status-codes";

import { MobileUserServiceDomain } from "../../../domain/mobile-app/user.domain";
import { AddPin, CreateUserMobileApp, MobileLoginInput, OtpVerification, createMobileUserSchema, loginUserSchema, otpVerificationSchema, pinUpdateSchema } from "../../../api/Request/mobileAppUser";

import { logUserActivity } from '../../../utils/utilsFunctions/user.activity';
import { ChangePasswordInput, changePasswordSchema } from "../../../api/Request/user";
export class UserHandler {
  private userService: MobileUserServiceDomain;

  constructor(userService: MobileUserServiceDomain) {
    this.userService = userService;
  }

  createUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = createMobileUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: parsed.error.errors });
      }
      const data: CreateUserMobileApp = parsed.data;
      const result = await this.userService.createUser(data);
      if (result.status === "error") {
        return res.status(StatusCodes.BAD_REQUEST).json(result);
      }
      // Insert User Activity
      await logUserActivity(result.data.user._id, req, result.data.user.email, 'Created User');
      return res.status(StatusCodes.CREATED).json(result);
    } catch (err: any) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }
  };
  otpVerification = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = otpVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: parsed.error.errors });
      }
      const data: OtpVerification = parsed.data;
      const result = await this.userService.otpVerification(data);

      if (result.status === "error") {
        return res.status(StatusCodes.BAD_REQUEST).json(result);
      }
      return res.status(StatusCodes.CREATED).json(result);
    } catch (err: any) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }
  };
  loginUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = loginUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: parsed.error.errors });
      }
      console.log(parsed, "parsed");
      const data: MobileLoginInput = parsed.data;
      const result = await this.userService.loginUser(data);
      if (result.status === "error") {
        return res.status(StatusCodes.UNAUTHORIZED).json(result);
      }
      // Insert User Activity
      await logUserActivity(result.data.user._id, req, result.data.user.email, 'Logged In');
      return res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }
  };
  addPin = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = pinUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: parsed.error.errors });
      }
      const data: AddPin = parsed.data;
      const result = await this.userService.addPin(data);

      if (result.status === "error") {
        return res.status(StatusCodes.BAD_REQUEST).json(result);
      }
      return res.status(StatusCodes.OK).send(result);
    } catch (err: any) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }
  };
  changePassword = async (req: Request & { user: any }, res: Response): Promise<any> => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
    }
    const userId = parsed?.data?.userId as string ?? '';
    if (!userId) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "UserId is required",
      });
    }
    const result = await this.userService.changePassword(userId, parsed.data as ChangePasswordInput);
    return res.status(result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.OK).json(result);
  };
  updateUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const id = req.params.id as any;
      if (!id) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: 'Id is required' });
      }
      const parsed = createMobileUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: parsed.error.errors });
      }
      const data: CreateUserMobileApp = parsed.data;
      const result = await this.userService.updateUser(id, data);
      if (result.status === "error") {
        return res.status(StatusCodes.BAD_REQUEST).json(result);
      }
      // Insert User Activity
      await logUserActivity(id, req, result.data.user.email, 'User Updated');
      return res.status(StatusCodes.CREATED).json(result);
    } catch (err: any) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }
  };
  userData = async (req: Request, res: Response): Promise<any> => {
    try {
      const id = req.params.id as any;
      if (!id) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: 'Id is required' });
      }
      const result = await this.userService.userData(id);
      if (result.status === "error") {
        return res.status(StatusCodes.BAD_REQUEST).json(result);
      }
      // Insert User Activity
      return res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }
  };
}

export function UserHandlerFun(service: MobileUserServiceDomain): UserHandler {
  return new UserHandler(service);
}

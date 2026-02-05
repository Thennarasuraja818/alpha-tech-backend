import { Request, Response } from "express";
import { UserServiceDomain } from "../../../domain/admin/userDomain";
import { CreateUserInput, createUserSchema, resetPasswordSchema, updateUserSchema, userListQuerySchema, changePasswordSchema, verifyOtpSchema, changePasswordAfterVerificationSchema } from "../../../api/Request/user";
import { StatusCodes } from "http-status-codes";

import AdminUsers from "../../model/admin.user";
import { mobileLoginSchema } from "../../../api/Request/wholesalerRequest";
import { logAdminUserActivity } from "../../../utils/utilsFunctions/admin.users.activity";
import { productListQuerySchema } from "../../../api/Request/product";
import { sendErrorResponse, sendPaginationResponse, sendResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";

export class UserHandler {
  private userService: UserServiceDomain;

  constructor(userService: UserServiceDomain) {
    this.userService = userService;
  }
  async generateUserId(): Promise<string> {
    // Count only users that are not marked as deleted
    const activeUserCount = await AdminUsers.countDocuments({ isDelete: { $ne: true } });

    const nextUserId = activeUserCount + 1;
    const paddedUserId = String(nextUserId).padStart(3, '0');

    return `USER${paddedUserId}`;
  }

  createUser = async (req: Request, res: Response): Promise<any> => {
    try {
      // Handle profile image upload
      console.log(req.files, "fffffffffffff");

      const profileImg = req.files?.profileImage
        ? Array.isArray(req.files.profileImage)
          ? req.files.profileImage[0]
          : req.files.profileImage
        : null;
      console.log(profileImg, "profileImg");

      const transformedBody = {
        ...req.body,
        isActive: req.body.isActive === 'true' ? true : req.body.isActive === 'false' ? false : req.body.isActive,
        isDelete: req.body.isDelete === 'true' ? true : req.body.isDelete === 'false' ? false : req.body.isDelete,
        salesWithCollection: req.body.salesWithCollection === 'true' ? true : req.body.salesWithCollection === 'false' ? false : req.body.salesWithCollection,
        orderStatusChangePermission: req.body.orderStatusChangePermission === 'true' ? true : req.body.orderStatusChangePermission === 'false' ? false : req.body.orderStatusChangePermission,
        cashHandoverUser: req.body.cashHandoverUser === 'true' ? true : req.body.cashHandoverUser === 'false' ? false : req.body.cashHandoverUser,
        returnOrderCollectedUser: req.body.returnOrderCollectedUser === 'true' ? true : req.body.returnOrderCollectedUser === 'false' ? false : req.body.returnOrderCollectedUser
      };

      const result = createUserSchema.safeParse(transformedBody);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;
      const userData: CreateUserInput = result.data as CreateUserInput;
      userData.createdBy = userId;
      userData.modifiedBy = userId;
      userData.userId = await this.generateUserId();

      const user = await this.userService.createUser(userData, profileImg);
      if (user.statusCode === 200) {
        const userVal = await AdminUsers.findOne({ email: result.data.email });
        // Insert User Activity
        await logAdminUserActivity(userVal?._id, req, result.data.email, 'Created User');
      }

      res.status(StatusCodes.OK).json(user);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      console.log(req.files, "rrrrrrrrrr");
      // console.log(req.file,"fffffff");


      // Handle profile image upload
      const profileImg = req.files?.profileImage
        ? Array.isArray(req.files.profileImage)
          ? req.files.profileImage[0]
          : req.files.profileImage
        : null;
      console.log(profileImg, "profileImg");

      const transformedBody = {
        ...req.body,
        isActive: req.body.isActive === 'true' ? true : req.body.isActive === 'false' ? false : req.body.isActive,
        isDelete: req.body.isDelete === 'true' ? true : req.body.isDelete === 'false' ? false : req.body.isDelete,
        salesWithCollection: req.body.salesWithCollection === 'true' ? true : req.body.salesWithCollection === 'false' ? false : req.body.salesWithCollection,
        orderStatusChangePermission: req.body.orderStatusChangePermission === 'true' ? true : req.body.orderStatusChangePermission === 'false' ? false : req.body.orderStatusChangePermission,
        cashHandoverUser: req.body.cashHandoverUser === 'true' ? true : req.body.cashHandoverUser === 'false' ? false : req.body.cashHandoverUser,
        returnOrderCollectedUser: req.body.returnOrderCollectedUser === 'true' ? true : req.body.returnOrderCollectedUser === 'false' ? false : req.body.returnOrderCollectedUser
      };

      const result = updateUserSchema.safeParse(transformedBody);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;
      const userData = {
        ...result.data,
        modifiedBy: userId
      };

      const response = await this.userService.updateUser(id, userData, profileImg);
      if (response.statusCode === 200) {
        const userVal = await AdminUsers.findOne({ email: result.data.email });
        // Insert User Activity
        await logAdminUserActivity(userVal?._id, req, result.data.email, 'User Profile Updated');
      }
      res.status(response.statusCode as number).json(response);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  getAllUsers = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = userListQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid query parameters',
          'INVALID_QUERY',
          queryResult.error.errors
        );
      }
      const users = await this.userService.getAllUsers(queryResult.data);

      // const users = await this.userService.getAllUsers();
      res.status(StatusCodes.OK).json(users);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
  getAllActiveUsers = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = userListQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid query parameters',
          'INVALID_QUERY',
          queryResult.error.errors
        );
      }
      const users = await this.userService.getAllActiveUsers(queryResult.data);

      // const users = await this.userService.getAllUsers();
      res.status(StatusCodes.OK).json(users);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  getUserSearch = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = userListQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid query parameters',
          'INVALID_QUERY',
          queryResult.error.errors
        );
      }
      const users = await this.userService.getUserSearch(queryResult.data);

      // const users = await this.userService.getAllUsers();
      res.status(StatusCodes.OK).json(users);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
  getAllInactiveUsers = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = userListQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid query parameters',
          'INVALID_QUERY',
          queryResult.error.errors
        );
      }
      const users = await this.userService.getAllInactiveUsers(queryResult.data);

      // const users = await this.userService.getAllUsers();
      res.status(StatusCodes.OK).json(users);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  getUserById = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const user = await this.userService.getUserById(id);
      ;
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
      }

      res.status(StatusCodes.OK).json(user);
    } catch (err: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  // updateUser = async (req: Request, res: Response): Promise<any> => {
  //   try {
  //     const { id } = req.params;
  //     const transformedBody = {
  //       ...req.body,
  //       isActive: req.body.isActive === 'true' ? true : req.body.isActive === 'false' ? false : req.body.isActive,
  //       isDelete: req.body.isDelete === 'true' ? true : req.body.isDelete === 'false' ? false : req.body.isDelete,
  //       salesWithCollection: req.body.salesWithCollection === 'true' ? true : req.body.salesWithCollection === 'false' ? false : req.body.salesWithCollection
  //     };
  //     const result = updateUserSchema.safeParse(transformedBody);
  //     if (!result.success) {
  //       return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
  //     }

  //     const userId = req.user?.id;
  //     const userData = {
  //       ...result.data,
  //       modifiedBy: userId
  //     };

  //     const response = await this.userService.updateUser(id, userData);
  //     if (response.statusCode === 200) {
  //       const userVal = await AdminUsers.findOne({ email: result.data.email });
  //       // Insert User Activity
  //       await logAdminUserActivity(userVal?._id, req, result.data.email, 'User Profile Updated');

  //     }
  //     res.status(response.statusCode as number).json(response);
  //   } catch (err: any) {

  //     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  //   }
  // };

  deleteUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params as any;
      const result = createUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
      }

      const userId = req.user?.id;
      const userData = {
        ...result.data,
        modifiedBy: userId,
        isDelete: true
      };

      const response = await this.userService.updateUser(id, userData);
      if (response.statusCode === 200) {
        const userVal = await AdminUsers.findOne({ email: result.data.email });
        // Insert User Activity
        await logAdminUserActivity(userVal?._id, req, result.data.email, 'User Deleted');
      }
      res.status(response.statusCode as number).json(response);
    } catch (err: any) {

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
  loginUser = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = mobileLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      }
      const data = parsed.data;
      const result = await this.userService.loginUser(data);
      if (result.status === "error") return res.status(StatusCodes.UNAUTHORIZED).json(result);
      // Insert User Activity
      // await logUserActivity(result.data.user._id, req, result.data.user.email, 'Logged In')
      return res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  changePassword = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      }
      const data: any = parsed.data;
      const result = await this.userService.changePassword(data.userId, data);
      console.log(result, "result-");

      if (result.status === "error") return res.status(StatusCodes.UNAUTHORIZED).json(result);
      if (result.statusCode === 200) {
        const userVal = await AdminUsers.findOne({ _id: result.data.userId });
        // Insert User Activity
        await logAdminUserActivity(userVal?._id, req, result.data.userId, 'Password Changed');
      }
      return res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<any> => {
    console.log("passsowweeeeeeeee")
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      }
      const data: any = parsed.data;
      const result = await this.userService.resetPassword(data.userId, data);
      if (result.status === "error") return res.status(StatusCodes.UNAUTHORIZED).json(result);
      if (result.statusCode === 200) {
        const userVal = await AdminUsers.findOne({ email: result.data.email });
        // Insert User Activity
        await logAdminUserActivity(userVal?._id, req, result.data.email, 'Password Changed');
      }
      return res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
  getUserLogsList = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = productListQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid query parameters',
          'INVALID_QUERY_PARAMS',
          queryResult.error.errors
        );
      }

      // Get validated and transformed query params
      const { page, limit, search, sort } = queryResult.data;

      const response = await this.userService.userLogList({
        page: Number(page) || 0,
        limit: Number(limit) || 100,
        search: String(search) || '',
        sort: sort === "desc" ? "desc" : "asc",
      });

      return sendPaginationResponse(res, response);

    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  }
  getAllCustomer = async (req: Request, res: Response): Promise<any> => {
    try {
      const queryResult = productListQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid query parameters',
          'INVALID_QUERY_PARAMS',
          queryResult.error.errors
        );
      }

      // Get validated and transformed query params
      const { page, limit, search, sort } = queryResult.data;

      const response = await this.userService.getAllCustomer({
        page: Number(page),
        limit: Number(limit),
        search: String(search),
        sort: sort === "desc" ? "desc" : "asc",
      });

      return sendPaginationResponse(res, response);

    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  }
  // Add these methods to your UserHandler class
  verifyOtp = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      }

      const result = await this.userService.verifyOtp(parsed.data);
      return res.status(result.statusCode as number).json(result);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };

  changePasswordAfterVerification = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsed = changePasswordAfterVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: parsed.error.errors });
      }

      const result = await this.userService.changePasswordAfterVerification(parsed.data);
      return res.status(result.statusCode as number).json(result);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  };
  getPincodes = async (req: Request, res: Response): Promise<any> => {
    try {
      const id = req.user.id;
      console.log(id);

      if (!id) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Tax ID is required',
          'INVALID_PARAMS'
        );
      }

      if (!Types.ObjectId.isValid(id)) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid UserId format',
          'INVALID_PARAMS'
        );
      }

      const response = await this.userService.getPincodes(id);
      return sendResponse(res, response);

    } catch (error: any) {
      return sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message || 'Internal server error',
        'INTERNAL_SERVER_ERROR'
      );
    }
  }

}




export function UserHandlerFun(service: UserServiceDomain): UserHandler {
  return new UserHandler(service);
}
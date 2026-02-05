
import Users from "../../app/model/user";
import { _config } from "../../config/config";
import { AuthMiddlewareDomain } from "../../domain/auth/auth.middleware";
import { Request, Response, NextFunction } from "express";
const jwt = require("jsonwebtoken");
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    userType: string;
  };
}

class MobileAuthMiddleware {
  private auths: AuthMiddlewareDomain;

  constructor(auth: AuthMiddlewareDomain) {
    this.auths = auth;
  }

  public ValidateUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(401).json({ message: "Unauthorized: No token provided" });
        return;
      }

      if (!_config?.JwtSecretKey) {
        res.status(400)
          .json({
            message: "Server configuration error: Secret key is missing",
          });
        return;
      }

      const decoded: any = jwt.verify(token, _config.JwtSecretKey);
      const userDtls = await this.auths.authumiddleware(decoded?.phone);
      if (userDtls) {
        const eistUser = await Users.findOne({ phone: decoded?.phone, isDelete: 0, isActive: 1 });
        if (!eistUser) {
          res.status(401).json({ message: "Invalid token" });
          return;
        }
        req.user = { id: decoded?.id.toString(), email: userDtls.email, userType: 'User' };
        next();
      } else {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        res.status(401).json({ message: "Token has expired" });
        return;
      }
      res.status(401).json({ message: "Invalid token" });
      return;
    }
  };
}
export function NewMobileAuthRegister(auth: AuthMiddlewareDomain) {
  return new MobileAuthMiddleware(auth);
}

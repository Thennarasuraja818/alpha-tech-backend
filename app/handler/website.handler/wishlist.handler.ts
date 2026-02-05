import { Request, Response } from "express";
import { IWishListRepository } from "../../../domain/website/wishlist.domain";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { WishlistModel } from "../../model/wishlist";
import { createCartSchema, CreateCart } from "../../../api/Request/cart";
export class WishListHandler {
  private WishListRepo: IWishListRepository;

  constructor(WishListRepo: IWishListRepository) {
    this.WishListRepo = WishListRepo;
  }

  createWishList = async (req: Request, res: Response): Promise<any> => {
    try {
      // Validate input
      // const parsed = createCartSchema.safeParse(req.body);
      // if (!parsed.success) {
      //   return res.status(StatusCodes.BAD_REQUEST).json({
      //     status: "error",
      //     message: "Validation failed",
      //     errors: parsed.error.errors,
      //   });
      // }

      const { type, userId, guestUserId, ...rest } = req.body;

      if (!type) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "User type is required",
        });
      }
      let existWishList: any
      if (type === 'user' && userId) {
        existWishList = await WishlistModel.findOne({
          userId: userId,
        })

      }
      if (type !== 'user' && guestUserId) {
        existWishList = await WishlistModel.findOne({
          guestUserId: guestUserId,
        })

      }
      const guestId = type === 'guest' ? await this.generateID() : '';

      const data: any = {
        ...rest,
        type,
        userId: type === 'user' ? userId ?? null : null,
        guestUserId: guestUserId ?? guestId,
      };
      let result: any;


      if (existWishList) {
        const newProduct = data.products[0];

        // Try to update quantity for existing product with same productId and attributes
        result = await WishlistModel.updateOne(
          {
            _id: existWishList._id,
            "products": {
              $elemMatch: {
                productId: newProduct.productId,
                attributes: newProduct.attributes
              }
            }
          },
          { "products.$.quantity": newProduct.quantity }
        );

        // If no existing product matched, push the new product
        if (result.modifiedCount === 0) {
          await WishlistModel.updateOne(
            { _id: existWishList._id },
            {
              $push: { products: newProduct }
            }
          );
        }
      } else {
        result = await this.WishListRepo.createWishlist(data);
      }

      return res.status(
        result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.CREATED
      ).json(result);

    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: err.message || "Internal server error",
      });
    }
  };

  updateWishList = async (req: Request, res: Response): Promise<any> => {
    try {
      const WishListId = req.params.id as any;

      if (!WishListId || !Types.ObjectId.isValid(WishListId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "A valid WishList ID is required",
        });
      }

      // const parsed = createCartSchema.safeParse(req.body);
      // if (!parsed.success) {
      //   return res.status(StatusCodes.BAD_REQUEST).json({
      //     status: "error",
      //     message: "Validation failed",
      //     errors: parsed.error.errors,
      //   });
      // }

      const { type, ...rest } = req.body;

      const data: any = { ...rest, type };

      const result = await this.WishListRepo.updateWishlist(WishListId, data);

      return res.status(
        result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.OK
      ).json(result);

    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: err.message || "Internal server error",
      });
    }
  };

  getWishList = async (req: Request, res: Response): Promise<any> => {
    const { limit, offset, search, sortBy = 'createdAt', order = 'desc', type, userType } = req.query;
    const userId = req.params.id as any;

    if (!userId || !type) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: !userId ? "WishList ID is required" : "Type is required",
      });
    }
    if (type === 'user' && !Types.ObjectId.isValid(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid ObjectId",
      });
    }

    const query = type === 'guest' ? { guestUserId: userId } : type === 'user' ? { userId } : null;

    if (query) {
      const WishList = await WishlistModel.findOne(query);
      if (!WishList) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "WishList is empty",
        });
      }
    }
    const result = await this.WishListRepo.getWishlist(userId, {
      limit: parseInt(limit as string) || 10,
      offset: parseInt(offset as string) || 0,
      search: search as string,
      sortOrder: sortBy as string,
      order: order === 'asc' ? 'asc' : 'desc',
      type: type as string ?? '',
      userType: userType as string ?? ''
    });
    if (result.status === "error") {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(result);
    }

    return res.status(StatusCodes.OK).json(result);
  };
  getWishListCount = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const userType = req.query.userType as string || '';
    if (!userType) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "User type is required",
      });
    }
    if (userType == 'user' && !Types.ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid ObjectId",
      });
    }


    const result = await this.WishListRepo.getWishlistCount(id, userType);
    if (result.status === "error") {
      return res.status(StatusCodes.NOT_FOUND).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };
  getWishListDetails = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params as any;
    const userType = req.query.userType as string || '';
    const productId = req.query.productId as string || '';
    if (!userType) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "User type is required",
      });
    }
    if (userType == 'user' && !Types.ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid ObjectId",
      });
    }
    if (!Types.ObjectId.isValid(productId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid ObjectId",
      });
    }


    const result = await this.WishListRepo.getWishlistDetails(id, userType, productId);
    if (result.status === "error") {
      return res.status(StatusCodes.NOT_FOUND).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };


  deleteWishList = async (req: Request, res: Response): Promise<any> => {
    try {
      const productId = req.params.id as any;

      if (!productId || !Types.ObjectId.isValid(productId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "A valid Product ID is required",
        });
      }
      const userId = req.query.userId as string ?? '';

      if (!userId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "A valid UserId is required",
        });
      }
      const result = await this.WishListRepo.deleteWishlist(productId, userId);

      return res.status(
        result.status === 'error' ? StatusCodes.BAD_REQUEST : StatusCodes.OK
      ).json(result);

    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: err.message || "Internal server error",
      });
    }
  };


  async generateID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export function WishListHandlerFun(WishListRepo: IWishListRepository): WishListHandler {
  return new WishListHandler(WishListRepo);
}



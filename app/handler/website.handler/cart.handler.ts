import { Request, Response } from "express";
import { ICartRepository } from "../../../domain/website/cart.domain";
import { CreateCart, createCartSchema } from "../../../api/Request/cart";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { CartModel } from "../../model/cart";
import OfferModel from "../../model/Offer";
export class CartHandler {
  private cartRepo: ICartRepository;

  constructor(cartRepo: ICartRepository) {
    this.cartRepo = cartRepo;
  }

  // In your cart controller class
  public createCart = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate input
      const parsed = createCartSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Validation failed",
          errors: parsed.error.errors,
        });
        return;
      }
      console.log(parsed.data, 'parsed.data');

      const { type, userId, guestUserId, products, offerId, quantity, ...rest } = parsed.data;

      if (!type) {
        res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "User type is required",
        });
        return;
      }
      if (!offerId && !products?.length) {
        res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "At least one product is required",
        });
        return;
      }
      if (offerId) {
        const offer = await OfferModel.findById(offerId);

        if (!offer || !offer.isActive || offer.isDelete || offer.offerType !== 'package') {
          res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: 'Invalid or inactive offer',
          })
          return
        }

        if (!offer.startDate || !offer.endDate) {
          res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: 'Offer date is missing',
          })
          return
        }

        const now = new Date()

        if (now < offer.startDate || now > offer.endDate) {
          res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: 'Offer is not currently active',
          })
          return
        }

      }
      const newProduct: any = products ? products[0] : [];

      const cartQuery = type === 'user'
        ? { userId, isDelete: false, isActive: true }
        : { guestUserId: guestUserId || await this.generateID(), isDelete: false, isActive: true };

      // Find or create cart
      let cart = await CartModel.findOne(cartQuery);
      let result: any;

      if (cart) {

        if (offerId) {
          await this.addPackageOfferToCart(type === 'user' ? userId : guestUserId, offerId, quantity ?? 1, type)
        } else {
          await this.updateExistingCartwithProduct(cart, newProduct);
        }

      } else {

        if (offerId) {
          await this.addPackageOfferToCart(type === 'user' ? userId : guestUserId, offerId, quantity ?? 1, type)

        } else {
          const cartData = {
            ...rest,
            type,
            userId: type === 'user' ? userId : null,
            guestUserId: type !== 'user' ? (guestUserId || await this.generateID()) : null,
            products,
            subtotal: newProduct?.mrpPrice * newProduct?.quantity,
            total: newProduct.mrpPrice * newProduct.quantity
          };

          result = await this.cartRepo.createCart(cartData);
        }
      }

      const updatedCart = result?.toObject ? result.toObject() : result;
      res.status(StatusCodes.CREATED).json({
        status: "success",
        data: updatedCart
      });

    } catch (err: any) {
      console.error("Cart creation error:", err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: err.message || "Internal server error",
      });
    }
  };

  // Helper method for attribute comparison
  private areAttributesEqual(attr1: any, attr2: any): boolean {
    if (!attr1 && !attr2) return true;
    if (!attr1 || !attr2) return false;

    const keys1 = Object.keys(attr1);
    const keys2 = Object.keys(attr2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key => {
      const val1 = attr1[key];
      const val2 = attr2[key];

      if (typeof val1 === 'object' && typeof val2 === 'object') {
        return JSON.stringify(val1) === JSON.stringify(val2);
      }
      return val1?.toString() === val2?.toString();
    });
  }

  updateCart = async (req: Request, res: Response): Promise<any> => {
    try {
      const cartId = req.params.id as any;

      if (!cartId || !Types.ObjectId.isValid(cartId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "A valid Cart ID is required",
        });
      }

      const parsed = createCartSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Validation failed",
          errors: parsed.error.errors,
        });
      }

      const { type, ...rest } = parsed.data;

      const data: CreateCart = { ...rest, type };

      const result = await this.cartRepo.updateCart(cartId, data);

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

  getCart = async (req: Request, res: Response): Promise<any> => {
    const { limit, offset, search, sortBy = 'createdAt', order = 'desc', type, userType } = req.query;
    const userId = req.params.id as any;

    if (!userId || !type) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: !userId ? "Cart ID is required" : "Type is required",
      });
    }
    if (type === 'user' && !Types.ObjectId.isValid(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid ObjectId",
      });
    }

    const query: any = type === 'guest' ? { guestUserId: userId } : type === 'user' ? { userId } : null;

    if (query) {
      query.isDelete = 0;
      const cart = await CartModel.findOne(query);
      if (!cart) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Cart is empty",
        });
      }
    }
    const result = await this.cartRepo.getCart(userId, {
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
  getCartCount = async (req: Request, res: Response): Promise<any> => {
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


    const result = await this.cartRepo.getCartCount(id, userType);
    if (result.status === "error") {
      return res.status(StatusCodes.NOT_FOUND).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };
  getCartDetails = async (req: Request, res: Response): Promise<any> => {
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


    const result = await this.cartRepo.getCartDetails(id, userType, productId);
    if (result.status === "error") {
      return res.status(StatusCodes.NOT_FOUND).json(result);
    }
    res.status(StatusCodes.OK).json(result);
  };


  deleteCart = async (req: Request, res: Response): Promise<any> => {
    try {
      const cartId = req.params.id as any;
      const productId = req.query.productId as string;
      const offer = req.query.offer as string;

      if (!cartId || !Types.ObjectId.isValid(cartId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "A valid Cart ID is required",
        });
      }

      if (!productId || !Types.ObjectId.isValid(productId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "A valid Product ID is required",
        });
      }

      const result = await this.cartRepo.deleteCart(cartId, productId, offer == "true" ? true : false);

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

  async addPackageOfferToCart(userId: string, offerId: string, quantity: number, type: string) {
    const offer: any = await OfferModel.findById(offerId);
    if (!offer) throw new Error('Offer not found');

    // Find or create cart
    let cart = type === 'user'
      ? await CartModel.findOne({ userId, isDelete: false, isActive: true }) || new CartModel({ userId, products: [], subtotal: 0, total: 0 })
      : await CartModel.findOne({ guestUserId: userId, isDelete: false, isActive: true }) || new CartModel({ guestUserId: userId, products: [], subtotal: 0, total: 0 });

    // Check if this offer already exists in cart
    const existingOfferProducts = cart.products.filter(p =>
      p.offerId?.toString() === offer._id.toString()
    );

    if (existingOfferProducts.length > 0) {
      // Update existing offer products
      cart.products.forEach(product => {
        if (product.offerId?.toString() === offer._id.toString()) {
          product.quantity = quantity;
        }
      });
    } else {
      // Add all products from the offer
      offer.productId.forEach((item: any) => {
        cart.products.push({
          productId: item.id,
          quantity: quantity,
          attributes: item.attributes,
          offerAmount: 0,
          price: offer.fixedAmount,
          offerId: offer._id,
          mrpPrice: offer.mrpPrice * quantity  // Store divided MRP per product
        });
      });
    }

    // Calculate totals
    this.calculateCartTotals(cart);

    await cart.save();
    return cart;
  }

  // Helper function to calculate totals
  // private calculateCartTotals(cart: any) {
  //   // Track unique offers to avoid double counting
  //   const uniqueOffers = new Set();
  //   let subtotal = 0;

  //   // First, calculate subtotal from offers (count each offer only once)
  //   cart.products.forEach((product: any) => {
  //     if (product.offerId) {
  //       const offerId = product.offerId.toString();

  //       // If this offer hasn't been counted yet
  //       if (!uniqueOffers.has(offerId)) {
  //         uniqueOffers.add(offerId);

  //         // Find all products with this offerId to calculate full offer MRP
  //         const allProductsInOffer = cart.products.find((p: any) =>
  //           p.offerId?.toString() === offerId
  //         );
  //         console.log(allProductsInOffer, 'allProductsInOffer');

  //         subtotal += allProductsInOffer.mrpPrice;
  //         console.log(subtotal, 'aaaaaaaa');

  //       }
  //     } else {
  //       // Non-offer products - add directly
  //       subtotal += (product.mrpPrice || 0) * (product.quantity || 1);
  //     }
  //   });
  //   console.log(subtotal, 'subtotal');

  //   cart.subtotal = subtotal;
  //   cart.total = subtotal; // If no discounts/taxes, total = subtotal
  // }
  private calculateCartTotals(cart: any) {
    const uniqueOffers = new Set();
    let subtotal = 0;

    cart.products.forEach((product: any) => {

      if (product.offerId) {
        const offerId = product.offerId.toString();

        // Count offer only once
        if (!uniqueOffers.has(offerId)) {
          uniqueOffers.add(offerId);

          // Add only ONCE: the main offer price
          subtotal += (product.offerPrice || product.mrpPrice || 0) * (product.quantity || 1);

        }

      } else {
        // normal products (count quantity)
        subtotal += (product.mrpPrice || 0) * (product.quantity || 1);
      }

    });

    cart.subtotal = subtotal;
    cart.total = subtotal;
  }


  async updateExistingCartwithProduct(cart: any, newProduct: any) {
    let result;

    const existingProduct = cart.products.find((p: any) =>
      p.productId.toString() === newProduct.productId.toString() &&
      this.areAttributesEqual(p.attributes, newProduct.attributes) && !p.offerId
    );

    if (existingProduct) {
      // Get the most recent product state directly from the DB to avoid stale in-memory data
      const freshCart = await CartModel.findOne({
        _id: cart._id,
        "products._id": existingProduct._id,
        isDelete: false
      }, { "products.$": 1 });

      const freshProduct = freshCart?.products?.[0];
      const quantityDiff = newProduct.quantity - (freshProduct?.quantity || 0);
      const priceDiff = quantityDiff * newProduct.mrpPrice;

      if (newProduct.quantity === 0) {

        if (cart.products.length === 1) {
          await CartModel.deleteOne({ _id: cart._id });
        }
        const pullQuery = { _id: new Types.ObjectId(freshProduct?._id) };
        const updateResult = await CartModel.updateOne(
          { _id: new Types.ObjectId(cart._id) },
          {
            $pull: { products: pullQuery },
            $inc: {
              subtotal: priceDiff,
              total: priceDiff,
            }
          }
        );

      } else {
        result = await CartModel.findOneAndUpdate(
          {
            _id: cart._id,
            "products._id": existingProduct._id,
            isDelete: false
          },
          {
            $set: {
              "products.$.quantity": newProduct.quantity,
              "products.$.mrpPrice": newProduct.mrpPrice,
            },
            $inc: {
              subtotal: priceDiff,
              total: priceDiff
            }
          },
          { new: true }
        );
      }

    } else {
      // Safe insert logic as-is
      result = await CartModel.findOneAndUpdate(
        { _id: cart._id, isDelete: false },
        {
          $push: { products: newProduct },
          $inc: {
            subtotal: newProduct.mrpPrice * newProduct.quantity,
            total: newProduct.mrpPrice * newProduct.quantity
          }
        },
        { new: true }
      );
    }

    return result;
  }

}

export function CartHandlerFun(cartRepo: ICartRepository): CartHandler {
  return new CartHandler(cartRepo);
}



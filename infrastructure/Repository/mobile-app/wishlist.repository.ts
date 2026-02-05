import { ICartRepository } from "../../../domain/website/cart.domain";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import { StatusCodes } from "http-status-codes";
// import { WishlistModel } from "../../../app/model/cart";
import { CartList, CreateCart } from "../../../api/Request/cart";
import { WishlistModel } from "../../../app/model/wishlist";
import { Types } from "mongoose";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import Attribute from "../../../app/model/attribute";
import { ProductModel } from "../../../app/model/product";
import { IWishListRepository } from "../../../domain/website/wishlist.domain";
import { ProductHelper } from "../../../utils/utilsFunctions/product.helper";
export class WishListRepository implements IWishListRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }


  async createWishlist(
    data: any
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {

      const cart = await WishlistModel.create(data);
      return successResponse("Cart created", StatusCodes.CREATED, cart);
    } catch (err: any) {
      return createErrorResponse(err.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async updateWishlist(id: string, data: any): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const cart = await WishlistModel.findByIdAndUpdate(id, data);
      return successResponse("Cart created", StatusCodes.CREATED, cart);
    } catch (err: any) {
      return createErrorResponse(err.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }


  async getWishlist(userId: string, options: CartList): Promise<ApiResponse<any> | ErrorResponse> {
    const {
      limit = 10,
      offset = 0,
      search,
      sortOrder = "createdAt",
      order = "asc",
      type,
      userType
    } = options;

    try {
      const query: any = {
        isDelete: false,
        isActive: true
      };

      query.userId = new Types.ObjectId(userId);
      // Search filter
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }

      // Sorting
      const sortDirection: 1 | -1 = order === "desc" ? -1 : 1;
      const sortOptions: { [key: string]: 1 | -1 } = { [sortOrder]: sortDirection };

      // Fetch wishlist items
      const cartItems = await WishlistModel.find(query)
        .limit(limit)
        .skip(offset)
        .sort(sortOptions);

      const totalCount = await WishlistModel.countDocuments(query);

      const finalResult = await Promise.all(
        cartItems.map(async (cartItem) => {
          const enhancedProducts = await Promise.all(
            cartItem.products.map(async (prod: any) => {
              const element: any = await ProductModel.findOne({
                _id: new Types.ObjectId(prod.productId),
                isActive: true,
                isDelete: false
              });

              if (!element) return null;


              const productDtls: any = {
                _id: element._id,
                productCode: element.productCode ?? "",
                productName: element.productName ?? "",
                shortDescription: element.shortDescription ?? "",
                productImage: element.productImage ?? "",
                additionalImage: element.additionalImage ?? "",
                lowStockAlert: element.lowStockAlert ?? "",
                tagAndLabel: element.tagAndLabel ?? "",
                refundable: element.refundable ?? "",
                productStatus: element.productStatus ?? "",
                description: element.description ?? "",
                applicableForWholesale: element.applicableForWholesale ?? "",
                wholesalerDiscount: element.wholesalerDiscount ?? "",
                wholesalerTax: element.wholesalerTax ?? "",
                applicableForCustomer: element.applicableForCustomer ?? "",
                customerDiscount: element.customerDiscount ?? "",
                customerTax: element.customerTax ?? "",
                quantityPerPack: element.quantityPerPack ?? "",
                packingType: element.packingType ?? "",
                isIncentive: element.isIncentive ?? false,
                showToLineman: element.showToLineman ?? false,
                metaTitle: element.metaTitle ?? "",
                metaKeyword: element.metaKeyword ?? "",
                metaDesc: element.metaDesc ?? "",
                delivery: element.delivery ?? "",
                vendorId: element.vendorId ?? "",
                createdBy: element.createdBy ?? "",
                modifiedBy: element.modifiedBy ?? "",
                categoryIdDetails: element.categoryIdDetails ?? "",
                subCategoryDetails: element.subCategoryDetails ?? "",
                childCategoryDetails: element.childCategoryDetails ?? "",
                brandName: element.brandName ?? "",
                vendorName: element.vendorName ?? "",
                wholesalerAttributeDetails: [],
                customerAttributeDetails: [],
                wishList: true,
                wishListId: prod?._id
              };

              if (type === 'customer' && element.customerAttribute?.attributeId) {
                const attributeDoc: any = await Attribute.find({
                  _id: { $in: element.customerAttribute?.attributeId }
                });

                if (attributeDoc) {
                  productDtls.customerAttributeDetails = ProductHelper.buildAttributeTree(
                    attributeDoc,
                    element.customerAttribute.rowData || [],
                    (element.customerAttribute.attributeId || []).map((id: any) => id.toString()),
                    0,                // level
                    undefined,        // parentAttrName
                    undefined,        // parentAttrValue
                    undefined,        // parentId
                    element.customerTax
                  );
                }
              } else if (type === 'wholesaler' && element.wholesalerAttribute?.attributeId) {
                const attributeDoc: any = await Attribute.find({
                  _id: { $in: element.wholesalerAttribute.attributeId }
                });

                if (attributeDoc) {
                  productDtls.wholesalerAttributeDetails = ProductHelper.buildAttributeTree(
                    attributeDoc,
                    element.wholesalerAttribute.rowData || [],
                    (element.wholesalerAttribute.attributeId || []).map((id: any) => id.toString()),
                    0,                // level
                    undefined,        // parentAttrName
                    undefined,        // parentAttrValue
                    undefined,        // parentId
                    0
                  );
                }
              }
              return productDtls;
            })
          );
          if (enhancedProducts?.length > 0) {
            return {
              ...cartItem.toObject(),
              products: enhancedProducts.filter(Boolean)
            };
          }

        })
      );

      return Pagination(totalCount, finalResult, limit, offset);

    } catch (err: any) {
      return createErrorResponse(
        err.message || "Failed to fetch wishlist items",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }


  async getWishlistCount(

    userId: string, userType: string
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      let count = 0;
      if (userType === 'user') {
        const item = await WishlistModel.findOne({ userId: new Types.ObjectId(userId), isActive: 1, isDelete: 0 });
        if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
        count = item.products?.length ?? 0;
      } else if (userType.trim() == 'guest') {
        console.log('inside')
        const items = await WishlistModel.find({ guestUserId: userId, isActive: 1, isDelete: 0 });
        if (!items.length) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
        count = items.reduce((acc, doc) => acc + (doc.products?.length ?? 0), 0);
      } else {
        return createErrorResponse("Invalid user type", StatusCodes.BAD_REQUEST);
      }

      return successResponse("Found", StatusCodes.OK, { count });
    } catch (err: any) {
      return createErrorResponse(err.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async getWishlistDetails(

    userId: string, userType: string, productId: string
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      if (userType === 'user') {
        const item = await WishlistModel.findOne({ userId: new Types.ObjectId(userId), isActive: 1, isDelete: 0, 'products.productId': new Types.ObjectId(productId) });
        if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
        return successResponse("Found", StatusCodes.OK, item);

      } else if (userType.trim() == 'guest') {
        console.log('inside')
        const items = await WishlistModel.find({ guestUserId: userId, isActive: 1, isDelete: 0, 'products.productId': new Types.ObjectId(productId) });
        if (!items.length) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
        return successResponse("Found", StatusCodes.OK, items);

      } else {
        return createErrorResponse("Invalid user type", StatusCodes.BAD_REQUEST);
      }

    } catch (err: any) {
      return createErrorResponse(err.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async deleteWishlist(productId: string, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      // 1. Find the cart and the specific product to be removed
      const cart = await WishlistModel.findOne({
        "products.productId": new Types.ObjectId(productId),
        userId: new Types.ObjectId(userId)
      });

      if (!cart) {
        return createErrorResponse("Wishlist not found", StatusCodes.BAD_REQUEST);
      }

      // 2. Find the product to be removed
      const productToRemove = cart.products.find(
        p => p.productId.toString() === productId
      );

      if (!productToRemove) {
        return createErrorResponse("Product not found in cart", StatusCodes.BAD_REQUEST);
      }

      // 3. Calculate amount to subtract

      // 4. Update the cart - remove product and adjust totals
      const updateResult = await WishlistModel.updateOne(
        { _id: new Types.ObjectId(cart._id) },
        {
          $pull: {
            products: { productId: new Types.ObjectId(productId) }
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        return createErrorResponse("Failed to update cart", StatusCodes.INTERNAL_SERVER_ERROR);
      }

      // 5. Return the updated cart
      return successResponse(
        "Product removed from cart successfully",
        StatusCodes.OK,
        updateResult
      );
    } catch (err: any) {
      return createErrorResponse(
        err.message || "Internal server error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export function newWishlistRepository(db: any): IWishListRepository {
  return new WishListRepository(db);
}

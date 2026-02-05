import { ICartRepository } from "../../../domain/website/cart.domain";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { createErrorResponse } from "../../../utils/common/errors";
import { successResponse } from "../../../utils/common/commonResponse";
import { StatusCodes } from "http-status-codes";
import { CartModel } from "../../../app/model/cart";
import { CartList, CreateCart } from "../../../api/Request/cart";

import { Types } from "mongoose";
import Pagination, { PaginationResult } from "../../../api/response/paginationResponse";
import Attribute from "../../../app/model/attribute";
import { ProductModel } from "../../../app/model/product";
import OfferModel from "../../../app/model/Offer";
import { RootModel } from "../../../app/model/root";
import { calculateDeliveryCharge, findMatchingAttributeRow } from '../../../utils/common/generateSlug'
import Users from "../../../app/model/user";
import WholesalerRetailsers from "../../../app/model/Wholesaler";
export class CartRepository implements ICartRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async createCart(
    data: CreateCart
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {

      const cart = await CartModel.create(data);
      return successResponse("Cart created", StatusCodes.CREATED, cart);
    } catch (err: any) {
      return createErrorResponse(err.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async updateCart(id: string, data: CreateCart): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const cart = await CartModel.findByIdAndUpdate(id, data);
      return successResponse("Cart created", StatusCodes.CREATED, cart);
    } catch (err: any) {
      return createErrorResponse(err.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async getCart(userId: string, options: CartList): Promise<ApiResponse<any> | ErrorResponse> {
    const {
      search,
      sortOrder = "createdAt",
      order = "asc",
      type,
      userType
    } = options;

    try {
      const matchQuery: any = {
        isDelete: false,
        isActive: true,
      };

      const parsedLimit = parseInt(String(options.limit ?? ""), 10);
      const parsedOffset = parseInt(String(options.offset ?? ""), 10);

      const limit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
      const offset = !isNaN(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

      if (userType === 'user') {
        matchQuery.userId = new Types.ObjectId(userId);
      } else if (userType === 'guest') {
        matchQuery.guestUserId = userId;
      }

      if (search) {
        matchQuery['products.name'] = { $regex: search, $options: 'i' };
      }

      const sortDirection: 1 | -1 = order === "desc" ? -1 : 1;

      const cartAggregation = await CartModel.aggregate([
        { $match: matchQuery },
        {
          $project: {
            subtotal: 1,
            total: 1,
            userId: 1,
            guestUserId: 1,
            createdAt: 1,
            updatedAt: 1,
            products: {
              $filter: {
                input: "$products",
                as: "product",
                cond: { $gt: ["$$product.quantity", 0] }
              }
            }
          }
        },
        {
          $sort: { [sortOrder]: sortDirection } // Sort carts
        },
        { $skip: offset },
        { $limit: limit }
      ]);

      // After aggregation, sort products inside each cart
      cartAggregation.forEach(cart => {
        cart.products.sort(
          (a: { createdAt: string | number | Date }, b: { createdAt: string | number | Date }) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      const totalCount = await CartModel.countDocuments(matchQuery);

      let customerTotalTax = 0;
      let wholesalerTotalTax = 0;
      let savedAmount = 0;
      let sellingPrice = 0;
      let deliveryCharge = 0;
      const seenOffers: any = [];
      const user: any = type === 'customer' ? (userType === 'guest' ? null : await Users.findOne({ _id: new Types.ObjectId(userId) })) :
        await WholesalerRetailsers.findOne({ _id: new Types.ObjectId(userId) })

      const enhancedResult = await Promise.all(
        cartAggregation.map(async (cartItem) => {
          // Create a temporary array to maintain order
          const orderedProducts = [];
          const root = await RootModel.findOne({
            "pincode.code": type === 'customer' ? user?.pincode : user.address.postalCode
          });

          const baseDeliveryCharge = root ? root.deliveryCharge : 0
          for (const prod of cartItem.products) {
            if (prod.offerId) {
              const offerIdStr = prod.offerId.toString();
              if (!seenOffers.includes(offerIdStr)) {
                seenOffers.push(offerIdStr);

                const offer = await OfferModel.findOne({ _id: new Types.ObjectId(prod.offerId) });
                if (offer) {
                  for (const val of offer?.productId) {
                    const product = await ProductModel.findById({ _id: new Types.ObjectId(val.id) })
                    const attribute = await findMatchingAttributeRow(product, val.attributes, type)
                    // ✅ SHIPPING WEIGHT SUM
                    const shippingWeight = attribute.shippingWeight ? Number(attribute.shippingWeight) : 0;
                    // console.log(root?.variants, typeof shippingWeight, 'shippingWeight');
                    console.log(deliveryCharge, 'deliveryCharge', shippingWeight,);

                    deliveryCharge += await calculateDeliveryCharge(root?.variants, shippingWeight, prod.quantity)
                    console.log('deliveryCharge', deliveryCharge);

                  }
                }

                orderedProducts.push({
                  _id: "",
                  offerType: offer?.offerType ?? '',
                  offerId: offer?._id ?? '',
                  productName: offer?.offerName ?? '',
                  productCartId: prod._id,
                  quantity: prod.quantity,
                  offerAmount: 0,
                  attributes: {},
                  customerAttribute: {
                    attributeId: [""],
                    rowData: [
                      { customermrp: "", maxLimit: "", price: "", sku: "", stock: "", Weight: "" },
                      { customermrp: "", maxLimit: "", price: "", sku: "", stock: "", Weight: "" }
                    ]
                  },
                  customerTax: 0,
                  description: "",
                  mrpPrice: (prod?.mrpPrice ?? 0),
                  price: offer?.fixedAmount || 0,
                  productImage: offer?.images,
                  wholesalerTax: 0,
                  "attributeData": [
                    {
                      "_id": "",
                      "name": "",
                      "value": [
                        {
                          "value": "",
                          "_id": "",
                          "stock": offer?.stock,
                          "maxLimit": offer?.stock
                        }
                      ]
                    }
                  ],
                });

                // calculate overall savedAmount
                const quantity = prod?.quantity ?? 0;
                const mrpPrice = prod?.mrpPrice ?? 0;
                const pricePerUnit = prod?.price ?? 0;

                const totalSelling = pricePerUnit * quantity;
                console.log(mrpPrice, pricePerUnit, 'pricePerUnit');

                sellingPrice += totalSelling;
                savedAmount += (mrpPrice * quantity) - totalSelling;
              }
            } else {
              const product = await ProductModel.aggregate([
                {
                  $match: {
                    _id: new Types.ObjectId(prod.productId),
                    isActive: true,
                    isDelete: false
                  }
                },
                {
                  $lookup: {
                    from: 'offers',
                    localField: '_id',
                    foreignField: 'productId.id',
                    as: 'offers'
                  }
                },
                {
                  $project: {
                    productName: 1,
                    description: 1,
                    productImage: 1,
                    customerTax: 1,
                    wholesalerTax: 1,
                    customerAttribute: 1,
                    wholesalerAttribute: 1,
                    offers: {
                      $filter: {
                        input: "$offers",
                        as: "offer",
                        cond: {
                          $and: [
                            { $eq: ["$$offer.isActive", true] },
                            { $eq: ["$$offer.isDelete", false] }
                          ]
                        }
                      }
                    }
                  }
                }
              ]);

              if (!product || product.length === 0) continue;

              const productData = product[0];
              const customerTaxPrice = (Number(productData.customerTax || 0) / 100) * Number(prod.price || 0);
              customerTotalTax += customerTaxPrice * Number(prod.quantity || 0);

              const wholesalerTaxPrice = (Number(productData.wholesalerTax || 0) / 100) * Number(prod.price || 0);
              wholesalerTotalTax += wholesalerTaxPrice * Number(prod.quantity || 0);

              const attributeValueIds = Object.values(prod?.attributes || {}).filter(
                (val): val is string => typeof val === "string"
              );

              const attributeObjectIds = attributeValueIds.map(id => new Types.ObjectId(id));

              const attributeDataRaw = await Promise.all(
                attributeObjectIds.map(async (id) => {
                  const result = await Attribute.findOne(
                    { "value._id": id },
                    {
                      name: 1,
                      value: { $elemMatch: { _id: id } }
                    }
                  );
                  return result?.toObject();
                })
              );

              let attributeData: any[] = attributeDataRaw.filter(Boolean);
              const attrSource =
                type === 'customer'
                  ? productData.customerAttribute
                  : productData.wholesalerAttribute;

              if (attrSource && Array.isArray(attrSource.rowData)) {
                const matchedRow = attrSource.rowData.find((row: any) =>
                  Object.entries(prod.attributes || {}).every(
                    ([key, value]) => row[key] === value
                  )
                );
                console.log('insidee');

                if (matchedRow) {

                  // ✅ SHIPPING WEIGHT SUM
                  const shippingWeight = matchedRow.shippingWeight
                    ? Number(matchedRow.shippingWeight)
                    : 0;
                  // console.log(root?.variants, typeof shippingWeight, 'shippingWeight');

                  deliveryCharge += await calculateDeliveryCharge(root?.variants, shippingWeight, prod.quantity)
                  console.log(deliveryCharge, 'deliveryCharge');

                  // 🔽 your existing attribute logic
                  for (const [key, val] of Object.entries(matchedRow)) {
                    const valStr = val as string;

                    if (['sku', 'price', 'shippingWeight'].includes(key)) continue;
                    if ((key !== 'stock' && key !== 'maxLimit') && !Types.ObjectId.isValid(valStr)) continue;

                    if (key !== 'stock' && key !== 'maxLimit') {
                      const valObjId = new Types.ObjectId(valStr);
                      const existingAttr = attributeData.find(attr => attr.name === key);
                      const stock = matchedRow.stock ? Number(matchedRow.stock) : undefined;
                      const maxlimit = matchedRow.maxLimit ? Number(matchedRow.maxLimit) : undefined;

                      if (existingAttr) {
                        const existingVal = existingAttr.value.find((v: any) => v._id.toString() === valStr);
                        if (!existingVal) {
                          const newVal: any = { _id: valObjId, value: valStr };
                          if (stock !== undefined) newVal.stock = stock;
                          if (maxlimit !== undefined) newVal.maxLimit = maxlimit;
                          existingAttr.value.push(newVal);
                        } else {
                          if (stock !== undefined) existingVal.stock = stock;
                          if (maxlimit !== undefined) existingVal.maxLimit = maxlimit;
                        }

                      } else {
                        const attrInfo = await Attribute.findOne(
                          { "value._id": valObjId },
                          {
                            name: 1,
                            value: { $elemMatch: { _id: valObjId } }
                          }
                        );

                        if (attrInfo) {
                          const attrObj = attrInfo.toObject();
                          const newValue: any = attrObj.value[0];
                          if (stock !== undefined) newValue.stock = stock;
                          if (maxlimit !== undefined) newValue.maxLimit = maxlimit;
                          const newAttr: any = {
                            _id: attrObj._id,
                            name: attrObj.name,
                            value: [newValue]
                          };

                          attributeData.push(newAttr);
                        }
                      }
                    }
                  }
                }
              }

              const finalProduct = {
                ...productData,
                quantity: prod.quantity,
                productCartId: prod._id,
                price: prod.price,
                attributeData,
                attributes: prod.attributes,
                offers: productData.offers || [],
                offerAmount: (prod?.offerAmount ?? 0),
                mrpPrice: (prod?.mrpPrice ?? 0),
                offerId: '',
                offerType: productData?.offers?.[0]?.offerType || 'no',
              };

              if (type === 'customer') {
                delete finalProduct.wholesalerAttribute;
              } else if (type === 'wholesaler') {
                delete finalProduct.customerAttribute;
              }

              orderedProducts.push(finalProduct);

              // calculate overall savedAmount
              const quantity = prod?.quantity ?? 0;
              const mrpPrice = prod?.mrpPrice ?? 0;
              const pricePerUnit = prod?.price ?? 0;

              const totalMrp = mrpPrice * quantity;
              const totalSelling = pricePerUnit * quantity;
              sellingPrice += totalSelling;
              savedAmount += totalMrp - totalSelling;
              // console.log(totalMrp, quantity, totalSelling, savedAmount, sellingPrice, 'sellingPrice');

            }
          }
          console.log(savedAmount, 'savedAmount');

          return {
            ...cartItem,
            products: orderedProducts.filter(Boolean),
            customerTotalTax,
            wholesalerTotalTax,
            total: sellingPrice + (type === 'customer' || type === 'User' ? 0 : wholesalerTotalTax) + (cartItem?.deliveryCharge ?? 0),
            subTotal: cartItem.subTotal,
            deliveryCharge: baseDeliveryCharge + deliveryCharge,
            savedAmount
          };
        })
      );



      return Pagination(totalCount, enhancedResult, limit, offset);

    } catch (err: any) {
      return createErrorResponse(
        err.message || "Failed to fetch cart items",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }


  async getCartCount(

    userId: string, userType: string
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      let count = 0;
      if (userType === 'user') {
        const item = await CartModel.findOne({ userId: new Types.ObjectId(userId), isActive: 1, isDelete: 0 });
        if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
        count = item.products?.length ?? 0;
      } else if (userType.trim() == 'guest') {
        //('inside')
        const items = await CartModel.find({ guestUserId: userId, isActive: 1, isDelete: 0 });
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
  async getCartDetails(

    userId: string, userType: string, productId: string
  ): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      if (userType === 'user') {
        const item = await CartModel.findOne({ userId: new Types.ObjectId(userId), isActive: 1, isDelete: 0, 'products.productId': new Types.ObjectId(productId) });
        if (!item) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
        return successResponse("Found", StatusCodes.OK, item);

      } else if (userType.trim() == 'guest') {
        //('inside')
        const items = await CartModel.find({ guestUserId: userId, isActive: 1, isDelete: 0, 'products.productId': new Types.ObjectId(productId) });
        if (!items.length) return createErrorResponse("Not found", StatusCodes.NOT_FOUND);
        return successResponse("Found", StatusCodes.OK, items);

      } else {
        return createErrorResponse("Invalid user type", StatusCodes.BAD_REQUEST);
      }

    } catch (err: any) {
      return createErrorResponse(err.message, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async deleteCart(cartId: string, productId: string, offer: boolean): Promise<ApiResponse<any> | ErrorResponse> {
    try {
      const cart = await CartModel.findOne({ _id: new Types.ObjectId(cartId) });
      if (!cart) {
        return createErrorResponse("Cart not found", StatusCodes.NOT_FOUND);
      }
      // const allOfferItems = cart.products.every((p: any) => !!p.offerId);
      // Handle full cart deletion if it's the last product
      // if (cart.products.length === 1 || allOfferItems) {
      if (cart.products.length === 1) {
        await CartModel.deleteOne({ _id: cart._id });
        return successResponse("Product removed from cart successfully", StatusCodes.OK, {});
      }
      console.log(cart.products, 'llllll', 'productId', productId);

      // Determine product match condition
      const matchCondition = offer
        ? (p: any) => p.offerId?.toString() === productId
        : (p: any) => p._id?.toString() === productId;

      const productToRemove = cart.products.find(matchCondition);
      if (!productToRemove) {
        return createErrorResponse("Product not found in cart", StatusCodes.NOT_FOUND);
      }

      const amountToSubtract = (offer == true ? (productToRemove.mrpPrice ?? 0) : (productToRemove.mrpPrice ?? 0)) * (productToRemove.quantity ?? 1);

      const pullQuery = offer
        ? { offerId: new Types.ObjectId(productId) }
        : { _id: new Types.ObjectId(productId) };
      console.log(pullQuery, amountToSubtract);

      const updateResult = await CartModel.updateOne(
        { _id: new Types.ObjectId(cartId) },
        {
          $pull: { products: pullQuery },
          $inc: {
            subtotal: -amountToSubtract,
            total: -amountToSubtract,
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        return createErrorResponse("Failed to update cart", StatusCodes.INTERNAL_SERVER_ERROR);
      }

      const updatedCart = await CartModel.findById(new Types.ObjectId(cartId));
      return successResponse("Product removed from cart successfully", StatusCodes.OK, updatedCart);

    } catch (err: any) {
      return createErrorResponse(err.message || "Internal server error", StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

}

export function newCartRepository(db: any): ICartRepository {
  return new CartRepository(db);
}

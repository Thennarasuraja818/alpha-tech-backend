import { Types } from 'mongoose';
import OfferModel from '../../../app/model/Offer';
import { OfferDomainRepository, OfferDtls } from '../../../domain/admin/offerDomain';
import { successResponse } from "../../../utils/common/commonResponse";
import { CreateOfferInput, UpdateOfferInput } from '../../../api/Request/offer';
import { createErrorResponse } from '../../../utils/common/errors';
import { StatusCodes } from 'http-status-codes';
import { ProductListParams } from '../../../domain/admin/productDomain';
import Pagination from '../../../api/response/paginationResponse';
import { Uploads } from '../../../utils/uploads/image.upload';
import { UploadedFile } from 'express-fileupload';
import { WishlistModel } from '../../../app/model/wishlist';
import { ProductHelper } from '../../../utils/utilsFunctions/product.helper';
import { ReviewModel } from '../../../app/model/review';
import Category from '../../../app/model/category';
import Attribute from '../../../app/model/attribute';
import { CouponModel } from '../../../app/model/coupon';

export class OfferRepository implements OfferDomainRepository {
    constructor(private db: any) { }

    async createOffer(input: CreateOfferInput, userId: string) {
        try {
            if (input.endDate <= input.startDate) {
                return createErrorResponse('endDate must be after startDate', StatusCodes.BAD_REQUEST);
            }

            const imageArr: string[] = [];
            let categoryIds: { id: Types.ObjectId }[] = [];
            let productIds: { id: Types.ObjectId }[] = [];

            // Handle image upload
            if (input?.images && (input.images as unknown as UploadedFile)) {
                const image = await Uploads.processFiles(
                    input.images,
                    "offer",
                    "img",
                    ''
                );
                imageArr.push(...image);
            }

            // Handle category IDs
            if (input.categoryId) {
                const ids = input.categoryId.split(',').filter(Boolean);
                categoryIds = ids.map(id => ({ id: new Types.ObjectId(id) }));
            }

            // Handle category IDs
            // if (input.productId) {
            //     const ids = input.productId.split(',').filter(Boolean);
            //     productIds = ids.map(id => ({ id: new ObjectId(id) }));
            // }
            // Create offer document
            const doc = await OfferModel.create({
                ...input,
                images: imageArr,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
                productId: productIds,
                categoryId: categoryIds
            });

            return successResponse('Offer created', StatusCodes.OK, doc);
        } catch (e: any) {
            return createErrorResponse('Error creating offer', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    async updateOffer(input: UpdateOfferInput, userId: string) {
        try {
            if (input.endDate && input.startDate && input.endDate <= input.startDate) {
                return createErrorResponse('endDate must be after startDate', StatusCodes.BAD_REQUEST);
            }
            let categoryIds: { id: Types.ObjectId }[] = [];
            let productIds: { id: Types.ObjectId }[] = [];

            const offerData = await OfferModel.findById(input.id);
            if (!offerData) {
                return createErrorResponse('Offer not found', StatusCodes.NOT_FOUND);
            }
            const imageArr = [];
            if (input?.images as unknown as UploadedFile) {
                const image = await Uploads.processFiles(
                    input?.images,
                    "offer",
                    "img",
                    offerData?.images[0]?.docName ?? ""
                );
                imageArr.push(...image);
            }
            // Handle category IDs
            if (input.categoryId) {
                const ids = input.categoryId.split(',').filter(Boolean);
                categoryIds = ids.map(id => ({ id: new Types.ObjectId(id) }));
            }

            // Handle category IDs
            // if (input.productId) {
            //     const ids = input.productId.split(',').filter(Boolean);
            //     productIds = ids.map(id => ({ id: new ObjectId(id) }));
            // }
            await OfferModel.updateOne(
                { _id: new Types.ObjectId(input.id), isActive: true, isDelete: false },
                {
                    $set: {
                        ...input,
                        images: imageArr ?? offerData?.images,
                        modifiedBy: new Types.ObjectId(userId),
                        productId: productIds,
                        categoryId: categoryIds
                    }
                }
            );
            return successResponse('Offer updated', StatusCodes.OK, { message: '' });
        } catch (e: any) {
            return createErrorResponse('Error updating offer', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async findOfferById(id: string) {
        try {
            const doc = await OfferModel.findOne({
                _id: new Types.ObjectId(id), isActive: true, isDelete: false
            }).populate('createdBy', 'name')
                .populate('modifiedBy', 'name');
            if (!doc) return createErrorResponse('Offer not found', StatusCodes.NOT_FOUND);
            return successResponse('Offer fetched', StatusCodes.OK, this._map(doc));
        } catch (e: any) {
            return createErrorResponse('Error fetching offer', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async listOffers(params: ProductListParams) {
        try {
            //('insideeeeeeeee');

            const { page, limit, userId, orderId, offerType, type } = params;
            const skip = page * limit;
            const match: any = {
                isActive: true, isDelete: false,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            };


            if (offerType) {
                match['offerType'] = offerType
            }

            const pipeline = [
                { $match: match },
                {
                    $lookup: {
                        from: "products",
                        localField: "productId.id",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $skip: skip * limit },
                { $limit: limit }
            ];

            const [data, count] = await Promise.all([
                OfferModel.aggregate(pipeline),
                OfferModel.countDocuments(match)
            ]);

            const finalResult = await Promise.all(data.map(async (offer) => {

                const products = offer.productDetails;
                const result = [];

                for (const product of products) {
                    const productId = new Types.ObjectId(product._id);
                    const attributeData = offer?.productId.find((e: any) => e.id.toString() === productId.toString());

                    let attr: any[] = [];

                    // PACKAGE OFFER
                    if (offerType === 'package') {
                        const attrIds = Object.values(attributeData?.attributes || {}).filter(v => typeof v === "string").map(id => new Types.ObjectId(id));

                        const rawAttrData = await Attribute.find({
                            "value._id": { $in: attrIds }
                        }, { name: 1, value: 1 }).lean();

                        const attrMap = new Map<string, any>();
                        rawAttrData.forEach(doc => attrMap.set(doc.name, doc));

                        const attrSource = type === 'customer' ? product.customerAttribute : product.wholesalerAttribute;
                        const matchedRow = attrSource?.rowData?.find((row: any) =>
                            Object.entries(attributeData.attributes || {}).every(([k, v]) => row[k] === v)
                        );


                        if (matchedRow) {
                            for (const [key, val] of Object.entries(matchedRow)) {
                                if (['sku', 'price'].includes(key)) continue;
                                if (!Types.ObjectId.isValid(val as string)) continue;

                                const objId = new Types.ObjectId(val as string);
                                const baseAttr = attrMap.get(key);

                                if (baseAttr) {
                                    const valMatch = baseAttr.value.find((v: any) => v._id.equals(objId));

                                    if (valMatch) {
                                        const stock = matchedRow.stock ? Number(matchedRow.stock) : undefined;
                                        const maxLimit = matchedRow.maxLimit ? Number(matchedRow.maxLimit) : undefined;
                                        valMatch.stock = stock ? stock.toString() : '';
                                        valMatch.maxLimit = stock ? stock.toString() : '';

                                        attr.push({
                                            _id: baseAttr._id,
                                            name: baseAttr.name,
                                            value: [valMatch]
                                        });
                                    }
                                }
                            }
                        }
                    }

                    const productDtls: any = {
                        ...product,

                        wholesalerAttributeDetails: offerType === "package" && type !== 'customer' ? attr : [],
                        customerAttributeDetails: offerType === "package" && type === 'customer' ? attr : [],
                        offerDiscount: offer?.discount ?? 0,
                        fixedAmount: offer.fixedAmount ?? 0
                    };

                    // NON-PACKAGE OFFERS
                    if (offerType !== 'package') {
                        const attrSource = type === 'customer' ? product.customerAttribute : product.wholesalerAttribute;

                        const attrIds = attrSource?.attributeId ?? [];
                        if (attrIds.length) {
                            const attributes = await Attribute.find({ _id: { $in: attrIds } }).lean();
                            const attrTree = ProductHelper.buildAttributeTree(
                                attributes,
                                attrSource?.rowData || [],
                                attrIds.map((id: any) => id.toString())
                            );
                            if (type === 'customer') {
                                productDtls.customerAttributeDetails = attrTree;
                                delete product.wholesalerAttribute;
                            } else productDtls.wholesalerAttributeDetails = attrTree
                            delete product.customerAttribute;
                        }
                    }

                    result.push(productDtls);
                }

                return {
                    ...offer,
                    productDetails: result
                };
            }));
            return Pagination(count, finalResult, limit, page);
        } catch (e: any) {
            console.error("Error in listOffers:", e);
            return createErrorResponse("Error listing offers", StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async deleteOffer(id: string, userId: string) {
        try {
            const doc = await OfferModel.findOneAndUpdate(
                { _id: new Types.ObjectId(id), isActive: true, isDelete: false },
                { $set: { isDelete: true, modifiedBy: new Types.ObjectId(userId), updatedAt: new Date() } },
                { new: true }
            );
            if (!doc) return createErrorResponse('Offer not found', StatusCodes.NOT_FOUND);
            return successResponse('Offer deleted', StatusCodes.OK, { message: '' });
        } catch (e: any) {
            return createErrorResponse('Error deleting offer', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }

    async listCoupons(params: any) {
        try {
            const { page, limit, } = params;
            const skip = page * limit;
            const now = new Date();

            const match = {
                isActive: true,
                isDelete: false,
                startDate: { $lte: now },
                endDate: { $gte: now }
            };

            const pipeline: any = [
                { $match: match },
                {
                    $lookup: {
                        from: "products",
                        localField: "productIds",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "categoryId",
                        foreignField: "_id",
                        as: "categories"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "userIds",
                        foreignField: "_id",
                        as: "users"
                    }
                },

            ];
            if (limit > 0) {
                pipeline.push(
                    { $skip: skip * limit },
                    { $limit: limit }
                )
            }
            const [data, count] = await Promise.all([
                CouponModel.aggregate(pipeline),
                CouponModel.countDocuments(match)
            ]);

            return Pagination(count, data, limit, page);
        } catch (e: any) {
            console.error("Error in listOffers:", e);
            return createErrorResponse("Error listing offers", StatusCodes.INTERNAL_SERVER_ERROR, e.message);
        }
    }
    private _map(doc: any): OfferDtls {
        return {
            _id: doc._id.toString(),
            title: doc.title,
            description: doc.description || '',
            brand: { _id: doc.brand._id.toString(), name: doc.brand.name },
            discount: doc.discount,
            startDate: doc.startDate,
            endDate: doc.endDate,
            isActive: doc.isActive,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            createdBy: doc.createdBy.toString(),
            modifiedBy: doc.modifiedBy.toString(),
            fixedAmount: doc.fixedAmount,
            offerType: doc.offerType
        };
    }
}

export const NewOfferRepository = (db: any) => new OfferRepository(db);

// const attributeValueIds = Object.values(prod?.attributes || {}).filter(
//                   (val): val is string => typeof val === "string"
//                 );
//                 const attributeObjectIds = attributeValueIds.map(id => new ObjectId(id));

//                 const attributeDataRaw = await Promise.all(
//                   attributeObjectIds.map(async (id) => {
//                     const result = await Attribute.findOne(
//                       { "value._id": id },
//                       {
//                         name: 1,
//                         value: { $elemMatch: { _id: id } }
//                       }
//                     );
//                     return result?.toObject();
//                   })
//                 );

//                 let attributeData: any[] = attributeDataRaw.filter(Boolean);
//                 const attrSource = type === 'customer' ? productData.customerAttribute : productData.wholesalerAttribute;

//                 if (attrSource && Array.isArray(attrSource.rowData)) {
//                   const matchedRow = attrSource.rowData.find((row: any) =>
//                     Object.entries(prod.attributes || {}).every(([key, value]) => row[key] === value)
//                   );

//                   if (matchedRow) {
//                     for (const [key, val] of Object.entries(matchedRow)) {
//                       const valStr = val as string;

//                       if (['sku', 'price'].includes(key)) continue;
//                       if ((key !== 'stock' && key !== 'maxLimit') && !ObjectId.isValid(valStr)) continue;

//                       if (key !== 'stock' && key !== 'maxLimit') {
//                         const valObjId = new ObjectId(valStr);
//                         const existingAttr = attributeData.find(attr => attr.name === key);
//                         const stock = matchedRow.stock ? Number(matchedRow.stock) : undefined;
//                         const maxlimit = matchedRow.maxLimit ? Number(matchedRow.maxLimit) : undefined;

//                         if (existingAttr) {
//                           const existingVal = existingAttr.value.find((v: any) => v._id.toString() === valStr);
//                           if (!existingVal) {
//                             const newVal: any = { _id: valObjId, value: valStr };
//                             if (stock !== undefined) newVal.stock = stock;
//                             if (maxlimit !== undefined) newVal.maxLimit = maxlimit;
//                             existingAttr.value.push(newVal);
//                           } else {
//                             if (stock !== undefined) existingVal.stock = stock;
//                             if (maxlimit !== undefined) existingVal.maxLimit = maxlimit;
//                           }
//                         } else {
//                           const attrInfo = await Attribute.findOne(
//                             { "value._id": valObjId },
//                             {
//                               name: 1,
//                               value: { $elemMatch: { _id: valObjId } }
//                             }
//                           );

//                           if (attrInfo) {
//                             const attrObj = attrInfo.toObject();
//                             const newValue: any = attrObj.value[0];
//                             if (stock !== undefined) newValue.stock = stock;
//                             if (maxlimit !== undefined) newValue.maxLimit = maxlimit;

//                             const newAttr: any = {
//                               _id: attrObj._id,
//                               name: attrObj.name,
//                               value: [newValue]
//                             };

//                             attributeData.push(newAttr);
//                           }
//                         }
//                       }
//                     }
//                   }
//                 }
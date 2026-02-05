import { Types } from 'mongoose';
import OfferModel from '../../../app/model/Offer';
import { OfferDomainRepository, OfferDtls } from '../../../domain/admin/offerDomain';
import { successResponse } from "../../../utils/common/commonResponse";
import { CreateOfferInput, UpdateOfferInput } from '../../../api/Request/offer';
import { createErrorResponse } from '../../../utils/common/errors';
import { StatusCodes } from 'http-status-codes';
import { ProductListParams } from '../../../domain/admin/productDomain';
import Pagination, { PaginationResult } from '../../../api/response/paginationResponse';
import { Uploads } from '../../../utils/uploads/image.upload';
import { UploadedFile } from 'express-fileupload';
import { ProductHelper } from '../../../utils/utilsFunctions/product.helper';
import Attribute from '../../../app/model/attribute';
import { ErrorResponse } from '../../../api/response/cmmonerror';

export class OfferRepository implements OfferDomainRepository {
    constructor(private db: any) { }
    listCoupons(params: any): Promise<PaginationResult<any> | ErrorResponse> {
        throw new Error('Method not implemented.');
    }

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
            if (input.productId && input.offerType !== 'package') {
                const ids = input.productId.split(',').filter(Boolean);
                productIds = ids.map((id: number) => ({ id: new Types.ObjectId(id) }));
            }
            else {
                productIds = JSON.parse(input.productId)
            }

            // Create offer document
            const doc = await OfferModel.create({
                ...input,
                images: imageArr,
                createdBy: new Types.ObjectId(userId),
                modifiedBy: new Types.ObjectId(userId),
                productId: productIds,
                categoryId: categoryIds,
                fixedAmount: +(input?.fixedAmount ?? 0),
                stock: +(input.stock ?? 0),
                mrpPrice: +(input.mrpPrice ?? 0)
            });
            console.log(doc, 'docccccccccccccccccccc');

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
            if (input.productId && input.offerType !== 'package') {
                const ids = input.productId.split(',').filter(Boolean);
                productIds = ids.map((id: number) => ({ id: new Types.ObjectId(id) }));
            }
            else {
                productIds = JSON.parse(input.productId)
            }
            await OfferModel.updateOne(
                { _id: new Types.ObjectId(input.id), isDelete: false },
                {
                    $set: {
                        ...input,
                        images: imageArr.length > 0 ? imageArr : offerData?.images,
                        modifiedBy: new Types.ObjectId(userId),
                        productId: productIds,
                        categoryId: categoryIds,
                        fixedAmount: +(input?.fixedAmount ?? 0),
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
            const { page, limit, userId, orderId, offerType, type } = params;
            const skip = page * limit;
            const match: any = { isDelete: false };


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
                {
                    $lookup: {
                        from: "categories",
                        localField: "categoryId.id",
                        foreignField: "_id",
                        as: "categories"
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
                    const uid = userId ? new Types.ObjectId(userId) : undefined;
                    const oid = orderId ? new Types.ObjectId(orderId) : undefined;

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
                                        valMatch.stock = stock;
                                        valMatch.maxLimit = maxLimit;

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
            const doc = await OfferModel.deleteOne({ _id: new Types.ObjectId(id) });
            if (!doc) return createErrorResponse('Offer not found', StatusCodes.NOT_FOUND);
            return successResponse('Offer deleted', StatusCodes.OK, { message: '' });
        } catch (e: any) {
            return createErrorResponse('Error deleting offer', StatusCodes.INTERNAL_SERVER_ERROR, e.message);
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
import { Request, Response } from 'express';
import { OfferService } from '../../../app/service/admin/offer.service';
import { StatusCodes } from 'http-status-codes';
import { createMobileUserSchema, CreateOfferInput } from '../../../api/Request/offer';

export class OfferHandler {
    constructor(private svc: OfferService) { }

    create = async (req: Request, res: Response) => {
        const files = (req.files as any)?.image;
        const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
        console.log(images, files);

        const payload = { ...req.body, images };
        const parsed = createMobileUserSchema.safeParse(payload);

        if (!parsed.success) {
            res
                .status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }
        const data: CreateOfferInput = parsed.data;
        const result = await this.svc.createOffer(data, req.user.id);
        res.status(result.statusCode).json(result);
    };

    update = async (req: Request, res: Response) => {
        const files = (req.files as any)?.image;
        const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
        const payload = { ...req.body, id: req.params.id, images };
        const parsed = createMobileUserSchema.safeParse(payload);

        if (!parsed.success) {
            res
                .status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }
        const data: CreateOfferInput = parsed.data;
        const result = await this.svc.updateOffer(data, req.user.id);
        res.status(result.statusCode).json(result);
    };

    getById = async (req: Request, res: Response) => {
        const result = await this.svc.findOfferById(req.params.id as any);
        res.status(result.statusCode).json(result);
    };

    list = async (req: Request, res: Response) => {
        // const { page = 0, limit = 10 ,} = req.query as any;
        const limit = parseInt(req.query.limit as string) || 100;
        const page = parseInt(req.query.page as string) || 0;
        const search = (req.query.search as string) || '';
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
        const userId = req.query.userId as string || '';
        const orderId = req.query.orderId as string || '';
        const type = req.query.type as string || '';
        const offerType = req.query.offerType as string || '';
        const stockType = req.query.stockType as string || ''

        const result: any = await this.svc.listOffers({
            page: +page, limit: +limit,
            search: search,
            categoryId: '',
            userId: userId,
            orderId: orderId,
            sort: 'desc',
            type: type,
            offerType: offerType,
            stockType: stockType
        });

        res.status(result.status).json(result);
    };
    listCoupons = async (req: Request, res: Response) => {
        // const { page = 0, limit = 10 ,} = req.query as any;
        const limit = parseInt(req.query.limit as string) || 100;
        const page = parseInt(req.query.page as string) || 0;
        const search = (req.query.search as string) || '';

        const result: any = await this.svc.listCoupons({
            page: +page, limit: +limit,
            search: search,
        });

        res.status(result.status).json(result);
    };
    delete = async (req: Request, res: Response) => {
        const result = await this.svc.deleteOffer(req.params.id as any, req.user.id);
        res.status(result.statusCode).json(result);
    };
}
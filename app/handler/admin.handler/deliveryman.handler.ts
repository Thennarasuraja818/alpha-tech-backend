import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DeliveryManService } from '../../service/admin/deliveryMan.service';
import { updateComplaintentStatus, UpdateComplaintStatus, UpdateDeiveryStatusInput, updateDeliveryStatusSchema, UpdateRequestStatus, updateRequestStatus } from '../../../api/Request/vehicleComplaint';

export class DeliveryManHandler {
    constructor(private svc: DeliveryManService) { }

    deliveryManOrderList = async (req: Request, res: Response) => {
        const limit = parseInt(req.query.limit as string) || 100;
        const page = parseInt(req.query.page as string) || 0;
        const search = (req.query.search as string) || '';
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
        const userId = req.user.id as string || '';
        const orderId = req.query.orderId as string || '';
        const type = req.query.type as string || '';
        const offerType = req.query.offerType as string || '';
        const stockType = req.query.stockType as string || ''

        const result: any = await this.svc.deliveryManOrderList({
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

    deliveryComplaintList = async (req: Request, res: Response) => {
        const limit = parseInt(req.query.limit as string) || 100;
        const page = parseInt(req.query.page as string) || 0;
        const search = (req.query.search as string) || '';
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
        const userId = req.user.id as string || '';
        const orderId = req.query.orderId as string || '';
        const type = req.query.type as string || '';
        const offerType = req.query.offerType as string || '';

        const result: any = await this.svc.deliveryComplaintList({
            page: +page, limit: +limit,
            search: search,
            categoryId: '',
            userId: userId,
            orderId: orderId,
            sort: 'desc',
            type: type,
            offerType: offerType,
        });

        res.status(result.status).json(result);
    };

    requestList = async (req: Request, res: Response) => {
        const limit = parseInt(req.query.limit as string) || 100;
        const page = parseInt(req.query.page as string) || 0;
        const search = (req.query.search as string) || '';
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
        const userId = req.user.id as string || '';
        const orderId = req.query.orderId as string || '';

        const result: any = await this.svc.requestList({
            page: +page, limit: +limit,
            search: search,
            userId: userId,
            orderId: orderId,
            sort: 'desc',
        });

        res.status(result.status).json(result);
    };
    updateComplaintStatus = async (req: Request, res: Response) => {

        const parsed = updateComplaintentStatus.safeParse(req.body);
        if (!parsed.success) {
            res.status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }

        const orderId = req.params.id as string;
        if (!orderId) {
            res.status(StatusCodes.BAD_REQUEST)
                .json({ errors: 'Order Id is required' });
            return;
        }

        const data: UpdateComplaintStatus = parsed.data;
        const result = await this.svc.updateComplaintStatus(orderId, data, req.user.id);
        res.status(result.statusCode).json(result);
    };
    updateRequestStatus = async (req: Request, res: Response) => {

        const parsed = updateRequestStatus.safeParse(req.body);
        if (!parsed.success) {
            res.status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }

        const orderId = req.params.id as string;
        if (!orderId) {
            res.status(StatusCodes.BAD_REQUEST)
                .json({ errors: 'Order Id is required' });
            return;
        }

        const data: UpdateRequestStatus = parsed.data;
        const result = await this.svc.updateRequestStatus(orderId, data, req.user.id);
        res.status(result.statusCode).json(result);
    };
}
import { Request, Response } from 'express';
import { OfferService } from '../../../app/service/admin/offer.service';
import { StatusCodes } from 'http-status-codes';
import { createMobileUserSchema, CreateOfferInput } from '../../../api/Request/offer';
import { DeliveryManService } from '../../service/mobile-app/deliveryMan.service';
import { CreateKilometerInput, createKilometerSchema, UpdateKilometerInput } from '../../../api/Request/KilometerReq';
import { CreateVehicleComplaintInput, createVehicleComplaintSchema, UpdateDeiveryStatusInput, updateDeliveryStatusSchema, UpdateVehicleComplaintInput } from '../../../api/Request/vehicleComplaint';
import { createDeliverymanReqSchema, CreateDeliveryReqInput } from '../../../api/Request/deliverymanreq';
import { CreateReturnPickedUpInput, createReturnPickedUpSchema } from '../../../api/Request/returnpickedup';
import AdminUsers from '../../model/admin.user';
import { logAdminUserActivity } from '../../../utils/utilsFunctions/admin.users.activity';
import { returnPickedupSettlementSchema, ReturnSettlementInput } from '../../../api/Request/returnpickedupsettlement';

export class DeliveryManHandler {
    constructor(private svc: DeliveryManService) { }

    create = async (req: Request, res: Response) => {
        const files = (req.files as any)?.image;
        const images = files ? (Array.isArray(files) ? files : [files]) : undefined;

        const payload = { ...req.body, beforeImg: images };
        const parsed = createKilometerSchema.safeParse(payload);

        if (!parsed.success) {
            res
                .status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }
        const data: CreateKilometerInput = parsed.data;
        const result = await this.svc.createKilometerHistory(data, req.user.id);
        if (result.statusCode === 200) {
            const userVal = await AdminUsers.findOne({ _id: req.user.id });
            // Insert User Activity
            await logAdminUserActivity(userVal?._id, req, userVal?.email ?? '', 'Kilometer request created');
        }
        res.status(result.statusCode).json(result);
    };

    update = async (req: Request, res: Response) => {
        const files = (req.files as any)?.image;
        const images = files ? (Array.isArray(files) ? files : [files]) : undefined;
        const payload = { ...req.body, afterImg: images };
        const parsed = createKilometerSchema.safeParse(payload);

        if (!parsed.success) {
            res
                .status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }
        const data: UpdateKilometerInput = parsed.data;
        const result = await this.svc.updateKilometerHistory(data, req.user.id);
        res.status(result.statusCode).json(result);
    };
    // New vehicle complaint methods
    createVehicleComplaint = async (req: Request, res: Response) => {
        const files = (req.files as any)?.image;
        console.log(files, 'files');

        const proof = files ? (Array.isArray(files) ? files : [files]) : undefined;
        const payload = { ...req.body, proof };

        const parsed = createVehicleComplaintSchema.safeParse(payload);

        if (!parsed.success) {
            res.status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }
        const data: CreateVehicleComplaintInput = parsed.data;

        const result = await this.svc.createVehicleComplaint(data, req.user.id);
        if (result.statusCode === 200) {
            const userVal = await AdminUsers.findOne({ _id: req.user.id });
            // Insert User Activity
            await logAdminUserActivity(userVal?._id, req, userVal?.email ?? '', 'Vehicle complaint created');
        }
        res.status(result.statusCode).json(result);
    };

    updateVehicleComplaint = async (req: Request, res: Response) => {
        const files = (req.files as any)?.image;
        const proof = files ? (Array.isArray(files) ? files : [files]) : undefined;

        const payload = { ...req.body, proof };
        const parsed = createVehicleComplaintSchema.safeParse(payload);

        if (!parsed.success) {
            res.status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }

        const data: UpdateVehicleComplaintInput = parsed.data;
        const result = await this.svc.updateVehicleComplaint(req.params.id as any, data, req.user.id);
        res.status(result.statusCode).json(result);
    };

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

    updateDeliveryStatus = async (req: Request, res: Response) => {

        const parsed = updateDeliveryStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }

        const orderId = req.params.id as any;
        if (!orderId) {
            res.status(StatusCodes.BAD_REQUEST)
                .json({ errors: 'Order Id is required' });
            return;
        }

        const data: UpdateDeiveryStatusInput = parsed.data;
        const result = await this.svc.updateDeliveryStatus(orderId, data, req.user.id);
        if (result.statusCode === 200) {
            const userVal = await AdminUsers.findOne({ _id: req.user.id });
            // Insert User Activity
            await logAdminUserActivity(userVal?._id, req, userVal?.email ?? '', 'Delivery status updated');
        }
        res.status(result.statusCode).json(result);
    };
    createRequesy = async (req: Request, res: Response) => {
        const parsed = createDeliverymanReqSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }
        const data: CreateDeliveryReqInput = parsed.data;

        const result = await this.svc.createRequesy(data, req.user.id);
        res.status(result.statusCode).json(result);
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
    createReturnPickedUp = async (req: Request, res: Response) => {

        const parsed = createReturnPickedUpSchema.safeParse(req.body);

        if (!parsed.success) {
            res
                .status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }
        const data: CreateReturnPickedUpInput = parsed.data;
        const result = await this.svc.createReturnPickedUp(data, req.user.id);
        if (result.statusCode === 200) {
            const userVal = await AdminUsers.findOne({ _id: req.user.id });
            // Insert User Activity
            await logAdminUserActivity(userVal?._id, req, userVal?.email ?? '', 'Return order picked up');
        }
        res.status(result.statusCode).json(result);
    };
    returnPickedUpList = async (req: Request, res: Response) => {
        const limit = parseInt(req.query.limit as string) || 100;
        const page = parseInt(req.query.page as string) || 0;
        const search = (req.query.search as string) || '';
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
        const userId = req.user.id as string || '';
        const type = req.query.type as string || '';

        const result: any = await this.svc.returnPickedUpList({
            page: +page, limit: +limit,
            search: search,
            userId: userId,
            sort: order,
            type: type,

        });
        res.status(result.status ?? result?.statusCode).json(result);
    };
    returnPickedUpSettlement = async (req: Request, res: Response) => {
        const parsed = returnPickedupSettlementSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(StatusCodes.BAD_REQUEST)
                .json({ errors: parsed.error.errors });
            return;
        }
        const data: ReturnSettlementInput = parsed.data;

        const result = await this.svc.returnPickedUpSettlement(data, req.user.id);
        res.status(result.statusCode).json(result);
    };
    getKilometerDetails = async (req: Request, res: Response) => {
        const date = req.query.date as string ?? ''

        const result = await this.svc.getKilometerDetails({ date }, req.user.id);
        res.status(result.statusCode).json(result);
    };
}
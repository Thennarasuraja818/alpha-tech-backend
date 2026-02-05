import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { DashboardDomainService } from "../../../domain/admin/dashboard.domain";

export class DashboardHandler {
    constructor(private service: DashboardDomainService) { }

    async getRecentCustomer(req: Request, res: Response) {
        try {

            const response = await this.service.getRecentCustomer();
            res.status(StatusCodes.OK).json(response);
        } catch (error: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }
    async getTopSellingProduct(req: Request, res: Response) {
        try {
            const dateFilter = req.query.dateFilter ?? undefined;
            const page = req.query.page ?? 0;
            const limit = req.query.limit ?? 5;
            const response = await this.service.topSellingProduct({dateFilter,page,limit});
            res.status(StatusCodes.OK).json(response);
        } catch (error: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }
    async getSalesOverview(req: Request, res: Response) {
        try {

            const status = (req.query.status as string) || undefined;
            const dateFilter = req.query.dateFilter ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            const search = req.query.search ?? undefined;
            const response = await this.service.getSalesOverview({ status, dateFilter, startDate, endDate, search });
            res.status(StatusCodes.OK).json(response);
        } catch (error: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }
    async getSalesOverviewByMonth(req: Request, res: Response) {
        try {
            const status = (req.query.status as string) || undefined;
            const filterType = req.query.filterType ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            const search = req.query.search ?? undefined;
            const response = await this.service.getSalesOverviewByMonth({ status, filterType, startDate, endDate, search });
            res.status(StatusCodes.OK).json(response);
        } catch (error: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }
    async getPaidOrdersList(req: Request, res: Response) {
        try {
            const status = (req.query.status as string) || undefined;
            const dateFilter = req.query.dateFilter ?? undefined;
            const startDate = req.query.startDate ?? undefined;
            const endDate = req.query.endDate ?? undefined;
            const search = req.query.search ?? undefined;
            const response = await this.service.getPaidOrdersList({ status, dateFilter, startDate, endDate, search });
            res.status(StatusCodes.OK).json(response);
        } catch (error: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }
}

export function NewDashboardHandler(service: DashboardDomainService): DashboardHandler {
    return new DashboardHandler(service);
}
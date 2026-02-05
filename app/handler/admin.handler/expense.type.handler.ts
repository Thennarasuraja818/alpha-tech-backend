import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { sendErrorResponse } from "../../../utils/common/commonResponse";
import { Types } from "mongoose";
import { ExpenseTypeDomainService } from "../../../domain/admin/expense.typeDomain";
import { CreateExpenseTypeInput, ExpenseTypeListQuerySchema, expenseTypeSchema, UpdateExpenseTypeInput, updateExpensetypeSchema } from "../../../api/Request/expense.type"

class ExpensetypeHandler {

    service: ExpenseTypeDomainService
    constructor(service: ExpenseTypeDomainService) {
        this.service = service
    }

    createExpenseType = async (req: Request, res: Response): Promise<any> => {
        try {
            const result = expenseTypeSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
            }

            const userId = req.user?.id;
            const rootInput: CreateExpenseTypeInput = req.body;
            const response = await this.service.createExpenseType(rootInput, userId);
            res.status(response.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(response);

        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };

    getAllExpenseType = async (req: Request, res: Response): Promise<any> => {
        try {

            const queryResult = ExpenseTypeListQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                return sendErrorResponse(
                    res, StatusCodes.BAD_REQUEST,
                    'Invalid query parameters', 'INVALID_QUERY_PARAMS',
                    queryResult.error.errors);
            }

            const { page, limit, search } = queryResult.data;

            const result = await this.service.getExpenseTypeList({
                page: Number(page),
                limit: Number(limit),
                search: String(search),
            });
            res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };

    getExpensetypeById = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;

            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Expense type ID is required',
                    'INVALID_PARAMS'
                );
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid Expense type ID format',
                    'INVALID_PARAMS'
                );
            }

            const result = await this.service.getExpensetypeById(id);
            res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };

    updateExpensetype = async (req: Request, res: Response): Promise<any> => {
        try {
            const result = updateExpensetypeSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(StatusCodes.BAD_REQUEST).json({ errors: result.error.errors });
            }

            const userId = req.user?.id;
            const id = req.params?.id;
            const rootData: any = req.body;
            rootData.id = id

            const response = await this.service.updateExpensetype(rootData, userId);
            res.status(response.statusCode as number).json(response);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };

    deleteExpenseType = async (req: Request, res: Response): Promise<any> => {
        try {
            const { id } = req.params as any;

            if (!id) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Expense type ID is required',
                    'INVALID_PARAMS'
                );
            }

            if (!Types.ObjectId.isValid(id)) {
                return sendErrorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    'Invalid Expense type ID format',
                    'INVALID_PARAMS'
                );
            }
            const userId = req.user?.id;

            const response = await this.service.deleteExpenseType(id, userId);
            res.status(response.statusCode as number).json(response);
        } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    };

}

export function NewExpensetypeHandlerRegister(service: ExpenseTypeDomainService): ExpensetypeHandler {
    return new ExpensetypeHandler(service)
}
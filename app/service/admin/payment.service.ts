import { ErrorResponse } from "../../../api/response/cmmonerror";
import { OrderDocument } from "../../model/order";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { IPaymentRepository, PaymentServiceDomain } from "../../../domain/admin/paymentDomain";

export class PaymentService implements PaymentServiceDomain {
    private repo: IPaymentRepository;
    constructor(repo: IPaymentRepository) {
        this.repo = repo;
    }
    orderlists(params: { page: number; limit: number, type: string, userId: string, orderType: string, orderCode: string }): Promise<PaginationResult<OrderDocument> | ErrorResponse> {
        return this.repo.orderlists(params);
    }
    unpaidorderlists(params: { page: number; limit: number }): Promise<PaginationResult<OrderDocument> | ErrorResponse> {
        return this.repo.unpaidorderlists(params);
    }
    dailypaymentlists(params: { page: number; limit: number }): Promise<PaginationResult<OrderDocument> | ErrorResponse> {
        return this.repo.dailypaymentlists(params);
    }
}

export function paymentServiceFun(
    repo: IPaymentRepository
): PaymentServiceDomain {
    return new PaymentService(repo);
}

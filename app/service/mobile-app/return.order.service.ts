import { CreateReturnOrderInput, UpdateReturnOrderInput } from "../../../api/Request/return.order";
import { ApiResponse, ErrorResponse } from "../../../api/response/commonResponse";

import { ReturnOrderDomainRepository, ReturnOrderDomainService } from "../../../domain/mobile-app/returnOrderDomain";

class ReturnOrderService implements ReturnOrderDomainService {
    constructor(private repo: ReturnOrderDomainRepository) { }
    create(input: CreateReturnOrderInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        return this.repo.create(input, userId);
    }

    update(id: string, input: UpdateReturnOrderInput, userId: string) {
        return this.repo.update(id, input, userId);
    }

    list(params: { page: number; limit: number, type: string, userId: string }) {
        return this.repo.list(params);
    }

    delete(id: string, userId: string) {
        return this.repo.delete(id, userId);
    }
    updateOrderStatus(id: string, status: string, userId: string) {
        return this.repo.updateOrderStatus(id, status, userId);
    }
    getReturnExchangeList(params: { page: number; limit: number, type: string, userId: string, status?: string, dateFilter?: string, startDate?: string, endDate?: string, }) {
        return this.repo.getReturnExchangeList(params);
    }
}


export function ReturnOrderServiceFun(
    repo: ReturnOrderDomainRepository
): ReturnOrderDomainService {
    return new ReturnOrderService(repo);
}

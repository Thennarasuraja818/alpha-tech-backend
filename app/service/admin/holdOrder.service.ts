import { CreateOrderInput, UpdateOrderInput } from "../../../api/Request/order";
import { ApiResponse, ErrorResponse } from "../../../api/response/commonResponse";
import { HoldOrderDomainRepository, HoldOrderDomainService } from "../../../domain/admin/holdOrder.domain";

class HoldOrderService implements HoldOrderDomainService {
    constructor(private repo: HoldOrderDomainRepository) { }

    create(input: CreateOrderInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        return this.repo.create(input, userId);
    }

    update(id: string, userId: string) {
        return this.repo.update(id, userId);
    }

    list(params: { page: number; limit: number, type: string, userId: string, orderStatus: string, dateFilter?: string, startDate?: string, endDate?: string, holdOrderId?: string, orderFrom?: string }) {
        return this.repo.list(params);
    }
}


export function HoldOrderServiceFun(
    repo: HoldOrderDomainRepository
): HoldOrderDomainService {
    return new HoldOrderService(repo);
}

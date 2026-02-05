import { CrmOrderDomainRepository, CrmOrderDomainService } from "../../../domain/admin/crmOrderDomain";
import { CreateOrderInput, UpdateOrderInput } from "../../../api/Request/order";
import { ApiResponse, ErrorResponse } from "../../../api/response/commonResponse";
import { ProductDocument } from "../../../api/response/product.response";
import { RootListParams } from "../../../domain/admin/root.Domain";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { RootDocumentResponse } from "../../../api/response/root.response";


class CrmOrderService implements CrmOrderDomainService {
    constructor(private repo: CrmOrderDomainRepository) { }
    topSellingProduct(params: { type: string; }): Promise<ApiResponse<ProductDocument[]> | ErrorResponse> {
        return this.repo.topSellingProduct(params);
    }

    create(input: CreateOrderInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        return this.repo.create(input, userId);
    }

    update(id: string, input: UpdateOrderInput, userId: string) {
        return this.repo.update(id, input, userId);
    }

    updateStatus(id: string, amount: number, userId: string) {
        return this.repo.updateStatus(id, amount, userId);
    }

    list(params: { page: number; limit: number, type: string, userId: string, orderStatus: string, dateFilter?: string, startDate?: string, endDate?: string,orderCode?: string }) {
        return this.repo.list(params);
    }

    delete(id: string, userId: string) {
        return this.repo.delete(id, userId);
    }

    getById(id: string) {
        return this.repo.getById(id);
    }
    lineManOrderList(params: { page: number; limit: number, type: string, userId: string, 
        status: string , dateFilter?: string, startDate?: string, endDate?: string }) {
        return this.repo.lineManOrderList(params);
    }
    getRouteList(params: RootListParams): Promise<PaginationResult<RootDocumentResponse[]> | ErrorResponse> {
        return this.repo.getRouteList(params);
    }
    updateOrderStatus(id: string, status: string, userId: string, reason: string) {
        return this.repo.updateOrderStatus(id, status, userId, reason);
    }
   
}


export function CrmOrderServiceFun(
    repo: CrmOrderDomainRepository
): CrmOrderDomainService {
    return new CrmOrderService(repo);
}

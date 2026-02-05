import { CreateCustomerInput } from "../../../api/Request/customer";
import { CreateOrderInput } from "../../../api/Request/order";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse } from "../../../api/response/commonResponse";
import { PosServiceDomain, IPosRepository } from "../../../domain/admin/posDomain";


export class PosService implements PosServiceDomain {
    private adminRepository: IPosRepository;

    constructor(adminRepository: IPosRepository) {
        this.adminRepository = adminRepository;
    }
    createCustomer(data: CreateCustomerInput): Promise<ApiResponse<any> | ErrorResponse> {
        return this.adminRepository.createCustomer(data);
    }
    getCustomerById(id: string): Promise<ApiResponse<any> | ErrorResponse> {
        return this.adminRepository.getCustomerById(id);

    }
    getAllCustomers(options: { limit?: number; offset?: number; search?: string; sortBy?: string; order?: "asc" | "desc"; }): Promise<ApiResponse<{ items: []; total: number; limit: number; offset: number; }> | ErrorResponse> {
        return this.adminRepository.getAllCustomers(options);

    }
    updateCustomer(id: string, data: CreateCustomerInput): Promise<ApiResponse<any> | ErrorResponse> {
        return this.adminRepository.updateCustomer(id, data);

    }
    deleteCustomer(id: string, userId: string): Promise<ApiResponse<null> | ErrorResponse> {
        return this.adminRepository.deleteCustomer(id, userId);
    }
    createOrder(input: CreateOrderInput, userId: string): Promise<ApiResponse<any> | ErrorResponse> {
        return this.adminRepository.createOrder(input, userId);
    }
}



// Factory function for service
export function posServiceFun(repo: IPosRepository): PosServiceDomain {
    return new PosService(repo);
}

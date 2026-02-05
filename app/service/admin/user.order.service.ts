import { MobileLoginInput } from "../../../api/Request/mobileAppUser";
import { CreateUserInput } from "../../../api/Request/user";
import { ApiResponse, ErrorResponse } from "../../../api/response/commonResponse";
import { UserOrderDomainRepository, UserOrderDomainService } from "../../../domain/admin/user.orderDomain";
import { IUserCreateRepository, UserServiceDomain } from "../../../domain/admin/userDomain";

export class UserOrderService implements UserOrderDomainService {
  private userRepository: UserOrderDomainRepository;

  constructor(userRepository: UserOrderDomainRepository) {
    this.userRepository = userRepository;
  }

  async list(params: { page: number; limit: number, type: string, userId: string, orderStatus: string }) {
    return this.userRepository.list(params);
}

}
// Factory function for service
export function userOrderServiceFun(userRepo: UserOrderDomainRepository): UserOrderDomainService {
  return new UserOrderService(userRepo);
}

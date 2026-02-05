import { AuthMiddlewareDomain } from "../../domain/auth/auth.middleware";
import { IAdminRepository } from "../../domain/admin/adminDomain";

class AdminAuthService implements AuthMiddlewareDomain{
    private userRepository: IAdminRepository;

    constructor(adminUserRepository: IAdminRepository) {
    this.userRepository = adminUserRepository;
    }

   async authumiddleware(email:string): Promise<any> {  
     return await  this.userRepository.findAdminByEmail(email)
    }

}
export function AdminAuthMiddlewareService(userRepo: IAdminRepository): AuthMiddlewareDomain {
    return new AdminAuthService(userRepo);
}
import { AuthMiddlewareDomain } from "../../domain/auth/auth.middleware";
import { IUserCreateRepository } from "../../domain/admin/userDomain";
class MobileAuthService implements AuthMiddlewareDomain {
    private adminuserRepository: IUserCreateRepository;

    constructor(adminuserRepository: IUserCreateRepository) {
        this.adminuserRepository = adminuserRepository;
    }
    async authumiddleware(phone: string): Promise<any> {
        // if (type === 'admin-user') {
        //     return await this.adminuserRepository.findUserByEmail(phone)
        // }
        return await this.adminuserRepository.findUserByEmail(phone)
    }

}
export function AdminUserMiddlewareService(userRepo: IUserCreateRepository): MobileAuthService {
    return new MobileAuthService(userRepo)
}
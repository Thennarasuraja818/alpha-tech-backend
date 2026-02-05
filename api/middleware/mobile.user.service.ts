import { AuthMiddlewareDomain } from "../../domain/auth/auth.middleware";
// import { IUserCreateRepository } from "../../domain/admin/userDomain";
import { IMobileUserRepository } from "../../domain/mobile-app/user.domain";
// import { newAdminUserRepository } from "../../infrastructure/Repository/Admin/admin.repository";
import { IUserCreateRepository } from "../../domain/admin/userDomain";
class MobileAuthService implements AuthMiddlewareDomain {
    private userRepository: IMobileUserRepository;
    // private adminuserRepository: IUserCreateRepository;

    constructor(userRepository: IMobileUserRepository) {
        this.userRepository = userRepository;
        // this.adminuserRepository = adminuserRepository;
    }
    async authumiddleware(phone: string, type: string): Promise<any> {
        // if (type === 'admin-user') {
        //     return await this.adminuserRepository.findUserByEmail(phone)
        // }
        return await this.userRepository.findUserByEmail(phone)
    }

}
export function MobileAuthMiddlewareService(userRepo: IMobileUserRepository): MobileAuthService {
    return new MobileAuthService(userRepo)
}
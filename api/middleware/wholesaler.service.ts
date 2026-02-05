import { AuthMiddlewareDomain } from "../../domain/auth/auth.middleware";
import { IWholesalerRepository } from "../../domain/mobile-app/wholsalerDomain";

class WholesalerAuthService implements AuthMiddlewareDomain {
    private userRepository: IWholesalerRepository;

    constructor(userRepository: IWholesalerRepository) {
        this.userRepository = userRepository;
    }

    async authumiddleware(email: string): Promise<any> {
        return await this.userRepository.findUserByEmail(email)
    }

}

export function WholesalerAuthMiddlewareService(
    userRepo: IWholesalerRepository
): AuthMiddlewareDomain {
    return new WholesalerAuthService(userRepo);
}
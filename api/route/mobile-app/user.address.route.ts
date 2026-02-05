import { Router } from 'express';
import { UserAddressRepository } from '../../../infrastructure/Repository/mobile-app/user.address.repository';
import { UserAddressHandlerFun } from '../../../app/handler/mobile-app/user.address.handler';
import { userAddressService } from '../../../app/service/mobile-app/user.address.service';
export function RegisterUseraddressRoute(
    router: Router,
    orderRepo: UserAddressRepository,
    middleware: any
) {
    const service = userAddressService(orderRepo);
    const handler = UserAddressHandlerFun(service);

    router.post('/address', handler.createUserAddress);
    router.get('/address/:id', handler.getUserAddress);
    router.get('/address-details/:id', handler.getUserAddressDetails);
    router.patch('/address/:id', handler.updateUserAddress);
    router.delete('/address/:id', handler.deleteUserAddress);
}
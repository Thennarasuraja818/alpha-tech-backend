import { Router } from 'express';
import { OrderDomainRepository } from '../../../domain/mobile-app/orderDomain';
import { OrderHandlerFun } from '../../../app/handler/mobile-app/order.handler';
import { OrderServiceFun } from '../../../app/service/mobile-app/order.service';
export function RegisterAdminUserOrderRoute(
    router: Router,
    orderRepo: OrderDomainRepository,
    middleware: any
) {
    const service = OrderServiceFun(orderRepo);
    const handler = OrderHandlerFun(service);

    router.post('/admin-users/orders', middleware, handler.create);
    router.get('/admin-users/orders', middleware, handler.list);
    router.get('/admin-users/orders/:id', middleware, handler.getById);
    router.patch('/admin-users/orders/:id', middleware, handler.update);
    router.patch('/admin-users/orders/status/:id', middleware, handler.updateStatus);
    router.delete('/admin-users/orders/:id', middleware, handler.delete);
}
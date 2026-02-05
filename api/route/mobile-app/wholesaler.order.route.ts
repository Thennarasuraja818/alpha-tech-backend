import { Router } from 'express';
import { OrderDomainRepository } from '../../../domain/mobile-app/orderDomain';
import { OrderHandlerFun } from '../../../app/handler/mobile-app/order.handler';
import { OrderServiceFun } from '../../../app/service/mobile-app/order.service';
export function RegisterWholesalerOrderRoute(
    router: Router,
    orderRepo: OrderDomainRepository,
    middleware: any
) {
    const service = OrderServiceFun(orderRepo);
    const handler = OrderHandlerFun(service);

    router.post('/wholesale/orders', middleware, handler.create);
    router.get('/wholesale/orders', middleware, handler.list);
    router.get('/wholesale/orders/:id', middleware, handler.getById);
    router.patch('/wholesale/orders/:id', middleware, handler.update);
    router.patch('/wholesale/orders/status/:id', middleware, handler.updateStatus);
    router.delete('/wholesale/orders/:id', middleware, handler.delete);

}
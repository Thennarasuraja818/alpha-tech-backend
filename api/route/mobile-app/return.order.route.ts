import { Router } from 'express';
import { ReturnOrderDomainRepository } from '../../../domain/mobile-app/returnOrderDomain';
import { ReturnOrderServiceFun } from '../../../app/service/mobile-app/return.order.service';
import { ReturnOrderHandlerFun } from '../../../app/handler/mobile-app/return.order.handler';
export function RegisterReturnOrderRoute(
    router: Router,
    orderRepo: ReturnOrderDomainRepository,
    middleware: any
) {
    const service = ReturnOrderServiceFun(orderRepo);
    const handler = ReturnOrderHandlerFun(service);

    router.post('/return-orders', middleware, handler.create);
    router.get('/return-orders', middleware, handler.list);
    router.patch('/return-orders/:id', middleware, handler.update);
    router.delete('/return-orders/:id', middleware, handler.delete);
    router.put('/return-orders/update-status', handler.updateOrderStatus);

}
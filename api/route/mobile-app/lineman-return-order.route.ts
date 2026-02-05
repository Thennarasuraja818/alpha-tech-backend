import { Router } from 'express';
import { ReturnOrderDomainRepository } from '../../../domain/mobile-app/returnOrderDomain';
import { ReturnOrderServiceFun } from '../../../app/service/mobile-app/return.order.service';
import { ReturnOrderHandlerFun } from '../../../app/handler/mobile-app/return.order.handler';
export function RegisterLineManReturnOrderRoute(
    router: Router,
    orderRepo: ReturnOrderDomainRepository,
    middleware: any
) {
    const service = ReturnOrderServiceFun(orderRepo);
    const handler = ReturnOrderHandlerFun(service);

    router.post('/lineman/return-orders', middleware, handler.create);
    router.get('/lineman/return-orders', middleware, handler.getReturnExchangeList);
    router.patch('/lineman/return-orders/:id', middleware, handler.update);
    router.delete('/lineman/return-orders/:id', middleware, handler.delete);
    router.put('/lineman/return-orders/update-status', handler.updateOrderStatus);

}
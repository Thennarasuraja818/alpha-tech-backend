import { Router } from 'express';
import { ReturnOrderDomainRepository } from '../../../domain/mobile-app/returnOrderDomain';
import { ReturnOrderServiceFun } from '../../../app/service/mobile-app/return.order.service';
import { ReturnOrderHandlerFun } from '../../../app/handler/mobile-app/return.order.handler';
export function RegisterWholesalerReturnOrderRoute(
    router: Router,
    orderRepo: ReturnOrderDomainRepository,
    middleware: any
) {
    const service = ReturnOrderServiceFun(orderRepo);
    const handler = ReturnOrderHandlerFun(service);

    router.post('/wholesaler/return-orders', middleware, handler.create);
    router.get('/wholesaler/return-orders', middleware, handler.list);
    router.patch('/wholesaler/return-orders/:id', middleware, handler.update);
    router.delete('/wholesaler/return-orders/:id', middleware, handler.delete);
    router.put('/wholesaler/return-orders/update-status', handler.updateOrderStatus);

}
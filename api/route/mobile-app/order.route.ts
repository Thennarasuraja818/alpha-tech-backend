import { Router } from 'express';
import { OrderDomainRepository } from '../../../domain/mobile-app/orderDomain';
import { OrderHandlerFun } from '../../../app/handler/mobile-app/order.handler';
import { OrderServiceFun } from '../../../app/service/mobile-app/order.service';
export function RegisterOrderRoute(
  router: Router,
  orderRepo: OrderDomainRepository,
  middleware: any
) {
  const service = OrderServiceFun(orderRepo);
  const handler = OrderHandlerFun(service);

  router.post('/orders', middleware, handler.create);
  router.get('/orders', middleware, handler.list);
  router.get('/orders/:id', middleware, handler.getById);
  router.patch('/orders/:id', middleware, handler.update);
  router.patch('/orders-status/:id', middleware, handler.updateStatus);
  router.delete('/orders/:id', middleware, handler.delete);
  router.get('/top/selling/product', handler.topSellingList);
  router.get('/line-man/orders/list', handler.lineManOrderList);
  router.get('/root/dtls/list', handler.getAllRoot);
  router.put('/orders/update-status', handler.updateOrderStatus);
  router.get('/line-man/orders', handler.linemanlist);
}
import { Router } from 'express';
import { CrmOrderDomainRepository } from '../../../domain/admin/crmOrderDomain';
import { CrmOrderHandlerFun } from '../../../app/handler/admin.handler/crm.handler';
import { CrmOrderServiceFun } from '../../../app/service/admin/crm.service';
export function RegisterCrmOrderRoute(
    router: Router,
    orderRepo: CrmOrderDomainRepository,
    middleware: any
) {
    const service = CrmOrderServiceFun(orderRepo); 
    const handler = CrmOrderHandlerFun(service);

    router.post('/Crm/orders', middleware, handler.create);
    router.get('/Crm/orders', middleware, handler.list);
    router.get('/Crm/orders/:id', middleware, handler.getById);
    router.patch('/Crm/orders/:id', middleware, handler.update);
    router.patch('/Crm/orders/status/:id', middleware, handler.updateStatus);
    router.delete('/Crm/orders/:id', middleware, handler.delete);

}
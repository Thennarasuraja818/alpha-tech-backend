import { Router } from "express";
import { UserHandlerFun } from "../../../app/handler/admin.handler/user.handler";
import { userServiceFun } from "../../../app/service/admin/user.service";
import { IUserCreateRepository } from "../../../domain/admin/userDomain";
import { newUserOrderRepository } from "../../../infrastructure/Repository/Admin/user.order";
import { UserOrderDomainRepository } from "../../../domain/admin/user.orderDomain";
import { userOrderServiceFun } from "../../../app/service/admin/user.order.service";
import { UserOrderHandlerFun } from "../../../app/handler/admin.handler/user.order.handler";

export function RegisterUserOrderRoute(router: Router, userRepo: UserOrderDomainRepository , middleware: any) {
  const service = userOrderServiceFun(userRepo);   
  const handler = UserOrderHandlerFun(service); 
  
  router.get('/user/orders', middleware, handler.list);

}

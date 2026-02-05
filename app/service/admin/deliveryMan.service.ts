import { DeliverymanDomainRepository } from '../../../domain/admin/deliverymanDomain';
import { CreateVehicleComplaintInput, UpdateComplaintStatus, UpdateDeiveryStatusInput, UpdateRequestStatus, UpdateVehicleComplaintInput } from '../../../api/Request/vehicleComplaint';

export class DeliveryManService {
    constructor(private repo: DeliverymanDomainRepository) { }
    deliveryManOrderList(params: any) {
        return this.repo.deliveryManOrderList(params);
    }
    deliveryComplaintList(params: any) {
        return this.repo.deliveryComplaintList(params);
    }
    requestList(params: any) {
        return this.repo.requestList(params);
    }
    updateComplaintStatus(id: string, input: UpdateComplaintStatus, userId: string) {
        return this.repo.updateComplaintStatus(id, input, userId);
    }
    updateRequestStatus(id: string, input: UpdateRequestStatus, userId: string) {
        return this.repo.updateRequestStatus(id, input, userId);
    }
}
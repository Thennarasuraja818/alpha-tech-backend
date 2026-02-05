import { CreateKilometerInput, UpdateKilometerInput } from '../../../api/Request/KilometerReq';
import { DeliverymanDomainRepository } from '../../../domain/mobile-app/deliverymanDomain';
import { CreateVehicleComplaintInput, UpdateDeiveryStatusInput, UpdateVehicleComplaintInput } from '../../../api/Request/vehicleComplaint';
import { CreateDeliveryReqInput } from '../../../api/Request/deliverymanreq';
import { CreateReturnPickedUpInput } from '../../../api/Request/returnpickedup';
import { ReturnSettlementInput } from '../../../api/Request/returnpickedupsettlement';

export class DeliveryManService {
    constructor(private repo: DeliverymanDomainRepository) { }

    createKilometerHistory(input: CreateKilometerInput, userId: string) { return this.repo.createKilometerHistory(input, userId); }
    updateKilometerHistory(input: UpdateKilometerInput, userId: string) { return this.repo.updateKilometerHistory(input, userId); }
    deliveryManOrderList(params: any) {
        return this.repo.deliveryManOrderList(params);
    }
    // New vehicle complaint methods
    createVehicleComplaint(input: CreateVehicleComplaintInput, userId: string) {
        return this.repo.createVehicleComplaint(input, userId);
    }
    updateVehicleComplaint(id: string, input: UpdateVehicleComplaintInput, userId: string) {
        return this.repo.updateVehicleComplaint(id, input, userId);
    }
    deliveryComplaintList(params: any) {
        return this.repo.deliveryComplaintList(params);
    }
    updateDeliveryStatus(id: string, input: UpdateDeiveryStatusInput, userId: string) {
        return this.repo.updateDeliveryStatus(id, input, userId);
    }
    createRequesy(input: CreateDeliveryReqInput, userId: string) {
        return this.repo.createRequest(input, userId);
    }
    requestList(params: any) {
        return this.repo.requestList(params);
    }
    createReturnPickedUp(input: CreateReturnPickedUpInput, userId: string) {
        return this.repo.createReturnPickedUp(input, userId);
    }
    returnPickedUpList(params: any) {
        return this.repo.returnPickedUpList(params);
    }
    returnPickedUpSettlement(input: ReturnSettlementInput, userId: string) {
        return this.repo.returnPickedUpSettlement(input, userId);

    }
    getKilometerDetails(input: any, userId: string) {
        return this.repo.getKilometerDetails(input, userId);
    }

}
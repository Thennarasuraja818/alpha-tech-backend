import { IVendorpurchaseRepository, VendorpurchaseServiceDomain } from "../../../domain/admin/purchaseDomain";
import { CreatePurchaseInput, UpdatePurchaseInput } from "../../../api/Request/purchase";
import { VendorListParams, VendorPayments } from "../../../api/Request/vendor";

export class PurchaseService implements VendorpurchaseServiceDomain {
  constructor(private repo: IVendorpurchaseRepository) { }


  createVendorpurchase(data: CreatePurchaseInput) {
    return this.repo.createVendorpurchase(data);
  }

  getVendorpurchaseById(id: string) {
    return this.repo.getVendorpurchaseById(id);
  }

  getAllVendorpurchases(opts: { page?: number; limit?: number; search?: string; sortBy?: string; order?: "asc" | "desc" }) {
    return this.repo.getAllVendorpurchases(opts);
  }

  updateVendorpurchase(id: string, data: UpdatePurchaseInput) {
    return this.repo.updateVendorpurchase(id, data);
  }

  deleteVendorpurchase(id: string, userId: string) {
    return this.repo.deleteVendorpurchase(id, userId);
  }
  getVendorPaymentList(opts: VendorListParams) {
    return this.repo.getVendorPaymentList(opts);
  }
  updatePayment(id: string, data: VendorPayments) {
    return this.repo.updatePayment(id, data);
  }
   getVendorPaymentDues(opts: VendorListParams) {
    return this.repo.getVendorPaymentDues(opts);
  }
}

export function purchaseServiceFun(repo: IVendorpurchaseRepository): VendorpurchaseServiceDomain {
  return new PurchaseService(repo);
}
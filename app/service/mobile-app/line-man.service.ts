import { ApiResponse, SuccessResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { AdminUser } from "../../../api/response/admin.response";
import { LineManServiceDomain } from "../../../domain/mobile-app/line-manDomain";
import { CreateVisitTracker } from "../../../api/Request/visitrackerReq";
import { ReceivePaymentInput } from "../../../api/Request/receivePayment";
import { ReceivePayment } from "../../../api/response/receivepayment";
import { ReceiveCashSettlementInput } from "../../../api/Request/cashsettle";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { UserlistSchema } from "../../../api/Request/user";
export class LineManService implements LineManServiceDomain {
    private adminRepository: LineManServiceDomain;

    constructor(adminRepository: LineManServiceDomain) {
        this.adminRepository = adminRepository;
    }
    async createVisitTracker(
        data: CreateVisitTracker
    ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
        const result = await this.adminRepository.createVisitTracker(data);
        if (result.status === "error") return result;
        return result;
    }
    async receivePayment(
        data: ReceivePaymentInput
    ): Promise<ApiResponse<AdminUser> | ErrorResponse> {
        const result = await this.adminRepository.receivePayment(data);
        if (result.status === "error") return result;
        return result;
    }
    async getPaymentModeSummaryForToday(userId: string): Promise<ApiResponse<ReceivePayment> | ErrorResponse> {
        const result = await this.adminRepository.getPaymentModeSummaryForToday(userId);
        if (result.status === "error") return result;
        return result;
    }
    async settleCash(input: ReceiveCashSettlementInput): Promise<ApiResponse<any> | ErrorResponse> {
        const result = await this.adminRepository.settleCash(input);
        if (result.status === "error") return result;
        return result;
    }
    async getCashSettlementList(params: any): Promise<PaginationResult<any> | ErrorResponse> {
        const result = await this.adminRepository.getCashSettlementList(params);
        if (result.status === "error") return result;
        return result;
    }
    async getAllUsers(opts: UserlistSchema): Promise<any> {
        return this.adminRepository.getAllUsers(opts);
    }
    async getPaymentList(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>> {
        const result = await this.adminRepository.getPaymentList(params);
        if (result.status === "error") return result;
        return result;
    }
    async getSalesTargetVsAchievementList(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>> {
        const result = await this.adminRepository.getSalesTargetVsAchievementList(params);
        if (result.status === "error") return result;
        return result;
    }
    async getSalesConversionReport(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>> {
        const result = await this.adminRepository.getSalesConversionReport(params);
        if (result.status === "error") return result;
        return result;
    }
    async getCustomerActivity(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>> {
        const result = await this.adminRepository.getCustomerActivity(params);
        if (result.status === "error") return result;
        return result;
    }
    async getOrderSummary(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>> {
        const result = await this.adminRepository.getOrderSummary(params);
        if (result.status === "error") return result;
        return result;
    }
    async inactiveCustomer(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>> {
        const result = await this.adminRepository.inactiveCustomer(params);
        if (result.status === "error") return result;
        return result;
    }
    async getVisitTrackerReport(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>> {
        const result = await this.adminRepository.getVisitTrackerReport(params);
        if (result.status === "error") return result;
        return result;
    }
    getOutstandingPayments(params: any) {
        return this.adminRepository.getOutstandingPayments(params);
    }
    getSalesPerformanceByUser(params: any) {
        return this.adminRepository.getSalesPerformanceByUser(params);
    }
    getPaymentDueList(params: any) {
        return this.adminRepository.getPaymentDueList(params);
    }
    getSalesTargetAchievement(params: any) {
        return this.adminRepository.getSalesTargetAchievement(params);
    }
    async getShopTypeList(params: any): Promise<PaginationResult<any> | ErrorResponse> {
        const result = await this.adminRepository.getShopTypeList(params);
        if (result.status === "error") return result;
        return result;
    }
}

// Factory function for service
export function mobileUserServiceFun(
    repo: LineManServiceDomain
): LineManServiceDomain {
    return new LineManService(repo);
}

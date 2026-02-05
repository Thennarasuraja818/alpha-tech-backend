import { ApiResponse, SuccessMessage, SuccessResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { CreateVisitTracker } from "../../api/Request/visitrackerReq";
import { ReceivePaymentInput } from "../../api/Request/receivePayment";
import { ReceivePayment } from "../../api/response/receivepayment";
import { ReceiveCashSettlementInput } from "../../api/Request/cashsettle";
import { PaginationResult } from "../../api/response/paginationResponse";
import { UserlistSchema } from "../../api/Request/user";
import { User } from "../../api/response/user.response";
import { ShopTypeListParams } from "../admin/shop.typeDomain";

export interface ILinemanRepository {
    // Password management
    createVisitTracker(
        data: CreateVisitTracker
    ): Promise<ApiResponse<any> | ErrorResponse>;
    receivePayment(data: ReceivePaymentInput): Promise<ApiResponse<any> | ErrorResponse>;
    getPaymentModeSummaryForToday(userId: string): Promise<ApiResponse<ReceivePayment> | ErrorResponse>;
    settleCash(input: ReceiveCashSettlementInput): Promise<ApiResponse<any> | ErrorResponse>;
    getCashSettlementList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    getAllUsers(params: UserlistSchema): Promise<PaginationResult<User[]> | ErrorResponse>;
    getPaymentList(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getSalesTargetVsAchievementList(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getSalesConversionReport(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getCustomerActivity(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getOrderSummary(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    inactiveCustomer(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getVisitTrackerReport(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getOutstandingPayments(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getSalesPerformanceByUser(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getPaymentDueList(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getSalesTargetAchievement(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getShopTypeList(params: ShopTypeListParams): Promise<PaginationResult<any[]> | ErrorResponse>;

}

export interface LineManServiceDomain {

    createVisitTracker(
        data: CreateVisitTracker
    ): Promise<ApiResponse<any> | ErrorResponse>;
    receivePayment(data: ReceivePaymentInput): Promise<ApiResponse<any> | ErrorResponse>;
    getPaymentModeSummaryForToday(userId: string): Promise<ApiResponse<ReceivePayment> | ErrorResponse>;
    settleCash(input: ReceiveCashSettlementInput): Promise<ApiResponse<any> | ErrorResponse>;
    getCashSettlementList(params: any): Promise<PaginationResult<any> | ErrorResponse>;
    getAllUsers(params: UserlistSchema): Promise<PaginationResult<User[]> | ErrorResponse>;
    getPaymentList(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getSalesTargetVsAchievementList(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getSalesConversionReport(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getCustomerActivity(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getOrderSummary(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    inactiveCustomer(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getVisitTrackerReport(params: any): Promise<ErrorResponse | SuccessResponse<{
        data: any[];
        pdfUrl: string;
    }>>;
    getOutstandingPayments(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getSalesPerformanceByUser(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getPaymentDueList(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getSalesTargetAchievement(params: any): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    getShopTypeList(params: ShopTypeListParams): Promise<PaginationResult<any[]> | ErrorResponse>;

}

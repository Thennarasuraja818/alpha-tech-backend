export interface AuthMiddlewareDomain {
    authumiddleware(phone: string, type?: string): Promise<any>;
}
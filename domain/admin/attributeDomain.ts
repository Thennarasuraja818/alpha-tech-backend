import { CreateAttributeInput, UpdateAttributeInput } from "../../api/Request/attribute";
import { Attribute, AttributeDtls } from "../../api/response/attribute.response";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../api/response/commonResponse";
import { PaginationResult } from "../../api/response/paginationResponse";

export interface AttributeListParams {
    page: number;
    limit: number;
    search: string;
    sort: 'asc' | 'desc';
    type:string
}

export interface AttributeDomainRepository {
    findAttributeNameExist(name: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    createAttribute(attributeInput: CreateAttributeInput, userId: string): Promise<ApiResponse<Attribute> | ErrorResponse>;
    updateAttribute(attributeInput: UpdateAttributeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findAttributeId(id: string): Promise<Boolean | ErrorResponse>;
    findAttributeNameForUpdate(name: string, id: string): Promise<{ count: number; statusCode: number } | ErrorResponse>;
    findAttributeById(id: string): Promise<ApiResponse<AttributeDtls> | ErrorResponse>;
    getAttributeList(params: AttributeListParams): Promise<PaginationResult<AttributeDtls> | ErrorResponse>;
    findAttributeInProduct(id:string): Promise<Boolean | ErrorResponse>;
    deleteAttribute(id: string, userId:string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> 
    
}

export interface AttributeDomainService {
    createAttribute(attributeInput: CreateAttributeInput, userId: string): Promise<ApiResponse<Attribute> | ErrorResponse>;
    updateAttribute(attributeInput: UpdateAttributeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse>;
    findAttributeById(id: string): Promise<ApiResponse<AttributeDtls> | ErrorResponse>;
    getAttributeList(params: AttributeListParams): Promise<PaginationResult<AttributeDtls> | ErrorResponse>;
    deleteAttribute(id: string, userId:string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> 

}

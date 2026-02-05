import { StatusCodes } from "http-status-codes";
import { CreateAttributeInput, UpdateAttributeInput } from "../../../api/Request/attribute";
import { Attribute, AttributeDtls } from "../../../api/response/attribute.response";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { AttributeDomainRepository, AttributeDomainService, AttributeListParams } from "../../../domain/admin/attributeDomain";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";

class AttributeService implements AttributeDomainService {
    private readonly attributeRepo: AttributeDomainRepository;

    constructor(repo: AttributeDomainRepository) {
        this.attributeRepo = repo;
    }
    async deleteAttribute(id: string, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.attributeRepo.findAttributeId(id);

            if (typeof isExist !== 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            if (!isExist) {
                return createErrorResponse(
                    'Attribute not found',
                    StatusCodes.BAD_REQUEST,
                    'Error Attribute not found'
                );
            }

              const attriInProduct = await this.attributeRepo.findAttributeInProduct(id)
            
            if (typeof attriInProduct !== 'boolean' && 'status' in attriInProduct && attriInProduct.status === 'error') {
                return attriInProduct as ErrorResponse;
            }

            return await this.attributeRepo.deleteAttribute(id, userId);
        } catch (error:any) {
            return createErrorResponse(
                'Error delete Attribute',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }        }

    async getAttributeList(params: AttributeListParams): Promise<PaginationResult<AttributeDtls> | ErrorResponse> {
        try {
            return await this.attributeRepo.getAttributeList(params);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving attribute list',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async findAttributeById(id: string): Promise<ApiResponse<AttributeDtls> | ErrorResponse> {
        try {
            return await this.attributeRepo.findAttributeById(id);
        } catch (error: any) {
            return createErrorResponse(
                'Error retrieving attribute details',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async createAttribute(attributeInput: CreateAttributeInput, userId: string): Promise<ApiResponse<Attribute> | ErrorResponse> {
        try {
            // Check for existing attribute name
            const existingName = await this.attributeRepo.findAttributeNameExist(attributeInput.name.trim());

            if ('count' in existingName && existingName.count > 0) {
                return createErrorResponse(
                    'Attribute name already exists',
                    StatusCodes.BAD_REQUEST,
                    'Error attribute name already exists'
                );
            }

            // Create the attribute
            return await this.attributeRepo.createAttribute({
                name: attributeInput.name.trim(),
                value: attributeInput.value.trim()
            },userId);
        } catch (error: any) {
            return createErrorResponse(
                'Error creating attribute',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }

    async updateAttribute(attributeInput: UpdateAttributeInput, userId: string): Promise<ApiResponse<SuccessMessage> | ErrorResponse> {
        try {
            const isExist = await this.attributeRepo.findAttributeId(attributeInput.id);

            if (isExist === false) {
                return createErrorResponse(
                    'Attribute not found',
                    StatusCodes.BAD_REQUEST,
                    'Error attribute not found'
                );
            }

            if (typeof isExist != 'boolean' && 'status' in isExist && isExist.status === 'error') {
                return isExist as ErrorResponse;
            }

            const existingName = await this.attributeRepo.findAttributeNameForUpdate(
                attributeInput.name.trim(),
                attributeInput.id
            );

            console.log(existingName,'existingName');
            
            if ('status' in existingName && existingName.status === 'error') {
                return existingName as ErrorResponse;
            }

            const existing = existingName as { count: number; statusCode: number };

            if (existing.statusCode === StatusCodes.OK && existing.count > 0) {
                return createErrorResponse(
                    'Attribute name already exists',
                    StatusCodes.BAD_REQUEST,
                    'Error attribute name already exists'
                );
            }

            // Update the attribute
            const response = await this.attributeRepo.updateAttribute(attributeInput, userId);
            return response;
        } catch (error: any) {
            return createErrorResponse(
                'Error updating attribute',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message
            );
        }
    }
}

export function NewAttributeService(repo: AttributeDomainRepository): AttributeDomainService {
    return new AttributeService(repo);
}

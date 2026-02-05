import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ApiResponse, SuccessMessage } from "../../../api/response/commonResponse";
import { createErrorResponse } from "../../../utils/common/errors";
import { PaginationResult } from "../../../api/response/paginationResponse";
import { BankDomainRepository, BankDomainService, BankListParams } from "../../../domain/admin/bankDomain";
import { CreateBankInput, UpdateBankInput } from "../../../api/Request/bank";

class BankService implements BankDomainService {
    private readonly bankRepo: BankDomainRepository;

    constructor(repo: BankDomainRepository) {
        this.bankRepo = repo;
    }

    async findBankAccountNumberExist(accountNumber: string) {
        try {
            const result = await this.bankRepo.findBankAccountNumberExist(accountNumber);
            if (result && 'status' in result) return result;
            return result || { count: 0, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse('Error checking account number', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async findBankId(id: string) {
        try {
            const result = await this.bankRepo.findBankId(id);
            if (result && typeof result === 'object' && 'status' in result) return result;
            return !!result;
        } catch (error: any) {
            return createErrorResponse('Error checking bank ID', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async findBankAccountNumberForUpdate(accountNumber: string, id: string) {
        try {
            const result = await this.bankRepo.findBankAccountNumberForUpdate(accountNumber, id);
            if (result && 'status' in result) return result;
            return result || { count: 0, statusCode: StatusCodes.OK };
        } catch (error: any) {
            return createErrorResponse('Error checking account number for update', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async findBankInUsage(id: string) {
        try {
            const result = await this.bankRepo.findBankInUsage(id);
            if (result && typeof result === 'object' && 'status' in result) return result;
            return !!result;
        } catch (error: any) {
            return createErrorResponse('Error checking bank usage', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async deleteBank(id: string, userId: string) {
        try {
            const isExist = await this.findBankId(id);
            if (typeof isExist === 'object' && 'status' in isExist) return isExist;
            if (!isExist) return createErrorResponse('Bank account not found', StatusCodes.BAD_REQUEST, 'Bank account not found');

            const inUsage = await this.findBankInUsage(id);
            if (typeof inUsage === 'object' && 'status' in inUsage) return inUsage;
            if (inUsage) return createErrorResponse('Bank account is in use and cannot be deleted', StatusCodes.BAD_REQUEST, 'Bank account in use');

            return await this.bankRepo.deleteBank(id, userId);
        } catch (error: any) {
            return createErrorResponse('Error deleting bank account', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async getBankList(params: BankListParams) {
        try {
            return await this.bankRepo.getBankList(params);
        } catch (error: any) {
            return createErrorResponse('Error retrieving bank list', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async findBankById(id: string) {
        try {
            return await this.bankRepo.findBankById(id);
        } catch (error: any) {
            return createErrorResponse('Error retrieving bank details', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async createBank(bankInput: CreateBankInput, userId: string) {
        try {
            // Convert bank name to uppercase
            bankInput.bankName = bankInput.bankName.toUpperCase();
            bankInput.ifscCode = bankInput.ifscCode.toUpperCase();

            const exists = await this.findBankAccountNumberExist(bankInput.accountNumber);
            if (exists && 'status' in exists) return exists;
            if ((exists as { count: number }).count > 0) {
                return createErrorResponse('Account number already exists', StatusCodes.BAD_REQUEST, 'Duplicate account number');
            }

            return await this.bankRepo.createBank(bankInput, userId);
        } catch (error: any) {
            return createErrorResponse('Error creating bank account', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async updateBank(bankInput: UpdateBankInput, userId: string) {
        try {
            if (!bankInput.id) {
                return createErrorResponse('Bank ID is required', StatusCodes.BAD_REQUEST, 'Missing bank ID');
            }

            // Convert bank name to uppercase
            bankInput.bankName = bankInput.bankName.toUpperCase();
            bankInput.ifscCode = bankInput.ifscCode.toUpperCase();

            const exists = await this.findBankAccountNumberForUpdate(bankInput.accountNumber, bankInput.id);
            if (exists && 'status' in exists) return exists;
            if ((exists as { count: number }).count > 0) {
                return createErrorResponse('Account number already exists', StatusCodes.BAD_REQUEST, 'Duplicate account number');
            }

            return await this.bankRepo.updateBank(bankInput, userId);
        } catch (error: any) {
            return createErrorResponse('Error updating bank account', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async toggleBankStatus(id: string, userId: string) {
        try {
            const isExist = await this.findBankId(id);
            if (typeof isExist === 'object' && 'status' in isExist) return isExist;
            if (!isExist) return createErrorResponse('Bank account not found', StatusCodes.BAD_REQUEST, 'Bank account not found');

            return await this.bankRepo.toggleBankStatus(id, userId);
        } catch (error: any) {
            return createErrorResponse('Error toggling bank status', StatusCodes.INTERNAL_SERVER_ERROR, error.message);
        }
    }
}

export function newBankService(repo: BankDomainRepository): BankDomainService {
    return new BankService(repo);
}
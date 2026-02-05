import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { IChildCategory } from "../../app/model/childCategory";
import { CreateChildCategoryInput, UpdateChildCategoryInput } from "../../api/Request/childCategory";

export interface IChildCategoryRepository {
    getChildCategoryById(id: string): Promise<ApiResponse<IChildCategory> | ErrorResponse>;
    getAllChildCategories(options: {
        subcategoryId?: string;
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        categoryId?: string;
    }): Promise<ApiResponse<{ items: IChildCategory[]; total: number; limit: number; offset: number }> | ErrorResponse>;
}

export interface ChildCategoryServiceDomain {
    getChildCategoryById(id: string): Promise<ApiResponse<IChildCategory> | ErrorResponse>;
    getAllChildCategories(options: {
        subcategoryId?: string;
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        categoryId?: string;
    }): Promise<ApiResponse<{ items: IChildCategory[]; total: number; limit: number; offset: number }> | ErrorResponse>;
}

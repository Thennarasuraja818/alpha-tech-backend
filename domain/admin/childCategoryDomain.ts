import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { IChildCategory } from "../../app/model/childCategory";
import { CreateChildCategoryInput, UpdateChildCategoryInput } from "../../api/Request/childCategory";

export interface IChildCategoryRepository {
  createChildCategory(data: CreateChildCategoryInput): Promise<ApiResponse<IChildCategory> | ErrorResponse>;
  getChildCategoryById(id: string): Promise<ApiResponse<IChildCategory> | ErrorResponse>;
  getAllChildCategoriesBySubcategory(subcategoryId: string): Promise<ApiResponse<IChildCategory[]> | ErrorResponse>;
  getAllChildCategories(options: {
    subcategoryId?: string;
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    categoryId: string;
    subCategoryId: string
  }): Promise<ApiResponse<{ items: IChildCategory[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  updateChildCategory(id: string, data: UpdateChildCategoryInput): Promise<ApiResponse<IChildCategory> | ErrorResponse>;
  deleteChildCategory(id: string): Promise<ApiResponse<null> | ErrorResponse>;
}

export interface ChildCategoryServiceDomain {
  createChildCategory(data: CreateChildCategoryInput): Promise<ApiResponse<IChildCategory> | ErrorResponse>;
  getChildCategoryById(id: string): Promise<ApiResponse<IChildCategory> | ErrorResponse>;
  getAllChildCategoriesBySubcategory(subcategoryId: string): Promise<ApiResponse<IChildCategory[]> | ErrorResponse>;
  getAllChildCategories(options: {
    subcategoryId?: string;
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    categoryId: string;
    subCategoryId: string
  }): Promise<ApiResponse<{ items: IChildCategory[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  updateChildCategory(id: string, data: UpdateChildCategoryInput): Promise<ApiResponse<IChildCategory> | ErrorResponse>;
  deleteChildCategory(id: string): Promise<ApiResponse<null> | ErrorResponse>;
}

import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ICategory } from "../../app/model/category";
import { CreateCategoryInput, UpdateCategoryInput } from "../../api/Request/category";

export interface ICategoryRepository {
  createCategory(data: CreateCategoryInput): Promise<ApiResponse<ICategory> | ErrorResponse>;
  getCategoryById(id: string): Promise<ApiResponse<ICategory> | ErrorResponse>;
  getAllCategories(options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ items: ICategory[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  updateCategory(id: string, data: UpdateCategoryInput): Promise<ApiResponse<ICategory> | ErrorResponse>;
  deleteCategory(id: string): Promise<ApiResponse<null> | ErrorResponse>;
}

export interface CategoryServiceDomain {
  createCategory(data: CreateCategoryInput): Promise<ApiResponse<ICategory> | ErrorResponse>;
  getCategoryById(id: string): Promise<ApiResponse<ICategory> | ErrorResponse>;
  getAllCategories(options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ items: ICategory[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  updateCategory(id: string, data: UpdateCategoryInput): Promise<ApiResponse<ICategory> | ErrorResponse>;
  deleteCategory(id: string): Promise<ApiResponse<null> | ErrorResponse>;
}

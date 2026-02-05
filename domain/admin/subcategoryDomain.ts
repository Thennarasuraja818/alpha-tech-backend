import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ISubcategory } from "../../app/model/subcategory";
import { CreateSubcategoryInput, UpdateSubcategoryInput } from "../../api/Request/subcategory";

export interface ISubcategoryRepository {
  createSubcategory(data: CreateSubcategoryInput): Promise<ApiResponse<ISubcategory> | ErrorResponse>;
  getSubcategoryById(id: string): Promise<ApiResponse<ISubcategory> | ErrorResponse>;
  getAllSubcategoriesByCategory(categoryId: string): Promise<ApiResponse<ISubcategory[]> | ErrorResponse>;
  getAllSubcategories(options: {
    categoryId?: string;
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ items: ISubcategory[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  updateSubcategory(id: string, data: UpdateSubcategoryInput): Promise<ApiResponse<ISubcategory> | ErrorResponse>;
  deleteSubcategory(id: string): Promise<ApiResponse<null> | ErrorResponse>;
}

export interface SubcategoryServiceDomain {
  createSubcategory(data: CreateSubcategoryInput): Promise<ApiResponse<ISubcategory> | ErrorResponse>;
  getSubcategoryById(id: string): Promise<ApiResponse<ISubcategory> | ErrorResponse>;
  getAllSubcategoriesByCategory(categoryId: string): Promise<ApiResponse<ISubcategory[]> | ErrorResponse>;
  getAllSubcategories(options: {
    categoryId?: string;
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ items: ISubcategory[]; total: number; limit: number; offset: number }> | ErrorResponse>;
  updateSubcategory(id: string, data: UpdateSubcategoryInput): Promise<ApiResponse<ISubcategory> | ErrorResponse>;
  deleteSubcategory(id: string): Promise<ApiResponse<null> | ErrorResponse>;
}

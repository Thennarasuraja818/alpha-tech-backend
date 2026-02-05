import { ApiResponse } from "../../api/response/commonResponse";
import { ErrorResponse } from "../../api/response/cmmonerror";
import { ISubcategory } from "../../app/model/subcategory";
import { CreateSubcategoryInput, UpdateSubcategoryInput } from "../../api/Request/subcategory";

export interface ISubcategoryRepository {
  getSubcategoryById(id: string): Promise<ApiResponse<ISubcategory> | ErrorResponse>;
  getAllSubcategories(options: {
    categoryId?: string;
    limit?: number;
    page?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ items: ISubcategory[]; total: number; limit: number; offset: number }> | ErrorResponse>;
}

export interface SubcategoryServiceDomain {
  getSubcategoryById(id: string): Promise<ApiResponse<ISubcategory> | ErrorResponse>;
  getAllSubcategories(options: {
    categoryId?: string;
    limit?: number;
    page?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ items: ISubcategory[]; total: number; limit: number; offset: number }> | ErrorResponse>;
}

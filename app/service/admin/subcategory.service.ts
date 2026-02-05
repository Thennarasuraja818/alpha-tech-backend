import { ISubcategoryRepository, SubcategoryServiceDomain } from "../../../domain/admin/subcategoryDomain";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ISubcategory } from "../../model/subcategory";
import { CreateSubcategoryInput, UpdateSubcategoryInput } from "../../../api/Request/subcategory";

export class SubcategoryService implements SubcategoryServiceDomain {
  private repo: ISubcategoryRepository;

  constructor(repo: ISubcategoryRepository) {
    this.repo = repo;
  }

  async createSubcategory(
    data: CreateSubcategoryInput
  ): Promise<ApiResponse<ISubcategory> | ErrorResponse> {
    return this.repo.createSubcategory(data);
  }

  async getSubcategoryById(
    id: string
  ): Promise<ApiResponse<ISubcategory> | ErrorResponse> {
    return this.repo.getSubcategoryById(id);
  }

  async getAllSubcategoriesByCategory(
    categoryId: string
  ): Promise<ApiResponse<ISubcategory[]> | ErrorResponse> {
    return this.repo.getAllSubcategoriesByCategory(categoryId);
  }

  async getAllSubcategories(
    options: {
      categoryId?: string;
      limit?: number;
      offset?: number;
      search?: string;
      sortBy?: string;
      order?: 'asc' | 'desc';
    }
  ): Promise<
    ApiResponse<{ items: ISubcategory[]; total: number; limit: number; offset: number }> | ErrorResponse
  > {
    return this.repo.getAllSubcategories({
      categoryId: options.categoryId,
      limit: options.limit ? Number(options.limit) : 100,
      offset: options.offset ? Number(options.offset) : 0,
      search: options.search,
      sortBy: options.sortBy || 'createdAt',
      order: options.order || 'desc'
    });
  }

  async updateSubcategory(
    id: string,
    data: UpdateSubcategoryInput
  ): Promise<ApiResponse<ISubcategory> | ErrorResponse> {
    return this.repo.updateSubcategory(id, data);
  }

  async deleteSubcategory(
    id: string
  ): Promise<ApiResponse<null> | ErrorResponse> {
    return this.repo.deleteSubcategory(id);
  }
}

export function subcategoryServiceFun(
  repo: ISubcategoryRepository
): SubcategoryServiceDomain {
  return new SubcategoryService(repo);
}

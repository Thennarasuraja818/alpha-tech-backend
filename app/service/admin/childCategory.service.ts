import { IChildCategoryRepository, ChildCategoryServiceDomain } from "../../../domain/admin/childCategoryDomain";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { IChildCategory } from "../../model/childCategory";
import { CreateChildCategoryInput, UpdateChildCategoryInput } from "../../../api/Request/childCategory";

export class ChildCategoryService implements ChildCategoryServiceDomain {
  private repo: IChildCategoryRepository;

  constructor(repo: IChildCategoryRepository) {
    this.repo = repo;
  }

  async createChildCategory(
    data: CreateChildCategoryInput
  ): Promise<ApiResponse<IChildCategory> | ErrorResponse> {
    return this.repo.createChildCategory(data);
  }

  async getChildCategoryById(
    id: string
  ): Promise<ApiResponse<IChildCategory> | ErrorResponse> {
    return this.repo.getChildCategoryById(id);
  }

  async getAllChildCategoriesBySubcategory(
    subcategoryId: string
  ): Promise<ApiResponse<IChildCategory[]> | ErrorResponse> {
    return this.repo.getAllChildCategoriesBySubcategory(subcategoryId);
  }
  async getAllChildCategories(options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    categoryId: string;
    subCategoryId: string
  }): Promise<ApiResponse<{ items: IChildCategory[]; total: number; limit: number; offset: number }> | ErrorResponse> {
    return this.repo.getAllChildCategories(options);
  }
  async updateChildCategory(
    id: string,
    data: UpdateChildCategoryInput
  ): Promise<ApiResponse<IChildCategory> | ErrorResponse> {
    return this.repo.updateChildCategory(id, data);
  }

  async deleteChildCategory(
    id: string
  ): Promise<ApiResponse<null> | ErrorResponse> {
    return this.repo.deleteChildCategory(id);
  }
}

export function childCategoryServiceFun(
  repo: IChildCategoryRepository
): ChildCategoryServiceDomain {
  return new ChildCategoryService(repo);
}

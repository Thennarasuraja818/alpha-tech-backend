import { ISubcategoryRepository, SubcategoryServiceDomain } from "../../../domain/website/subcategory.domain";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ISubcategory } from "../../model/subcategory";
import { CreateSubcategoryInput, UpdateSubcategoryInput } from "../../../api/Request/subcategory";

export class SubcategoryService implements SubcategoryServiceDomain {
  private repo: ISubcategoryRepository;

  constructor(repo: ISubcategoryRepository) {
    this.repo = repo;
  }

  async getSubcategoryById(
    id: string
  ): Promise<ApiResponse<ISubcategory> | ErrorResponse> {
    return this.repo.getSubcategoryById(id);
  }

  async getAllSubcategories(
    options: {
      categoryId?: string;
      limit?: number;
      page?: number;
      search?: string;
      sortBy?: string;
      order?: 'asc' | 'desc';
    }
  ): Promise<
    ApiResponse<{ items: ISubcategory[]; total: number; limit: number; offset: number }> | ErrorResponse
  > {
    return this.repo.getAllSubcategories(options);
  }

}

export function subcategoryServiceFun(
  repo: ISubcategoryRepository
): SubcategoryServiceDomain {
  return new SubcategoryService(repo);
}

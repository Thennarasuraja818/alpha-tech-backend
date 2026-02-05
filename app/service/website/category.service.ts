import { ICategoryRepository, CategoryServiceDomain } from "../../../domain/website/category.domain";
import { ApiResponse } from "../../../api/response/commonResponse";
import { ErrorResponse } from "../../../api/response/cmmonerror";
import { ICategory } from "../../model/category";

export class CategoryService implements CategoryServiceDomain {
    private repo: ICategoryRepository;

    constructor(repo: ICategoryRepository) {
        this.repo = repo;
    }

    async getCategoryById(
        id: string
    ): Promise<ApiResponse<ICategory> | ErrorResponse> {
        return this.repo.getCategoryById(id);
    }

    async getAllCategories(options: {
        limit?: number;
        offset?: number;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
    }): Promise<ApiResponse<{ items: ICategory[]; total: number; limit: number; offset: number }> | ErrorResponse> {
        return this.repo.getAllCategories(options);
    }

}

export function categoryServiceFun(
    repo: ICategoryRepository
): CategoryServiceDomain {
    return new CategoryService(repo);
}

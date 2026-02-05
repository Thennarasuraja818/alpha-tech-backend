import { CreateOfferInput, UpdateOfferInput } from '../../../api/Request/offer';
import { OfferDomainRepository } from '../../../domain/admin/offerDomain';
import { ProductListParams } from '../../../domain/admin/productDomain';
// import { ProductListParams } from '../../../domain/mobile-app/productDomain';
export class OfferService {
    constructor(private repo: OfferDomainRepository) { }

    createOffer(input: CreateOfferInput, userId: string) { return this.repo.createOffer(input, userId); }
    updateOffer(input: UpdateOfferInput, userId: string) { return this.repo.updateOffer(input, userId); }
    findOfferById(id: string) { return this.repo.findOfferById(id); }
    listOffers(params: ProductListParams) { return this.repo.listOffers(params); }
    deleteOffer(id: string, userId: string) { return this.repo.deleteOffer(id, userId); }
    listCoupons(params: any) { return this.repo.listCoupons(params); }

}
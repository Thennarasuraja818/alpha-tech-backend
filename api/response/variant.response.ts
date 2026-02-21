export interface Variant {
    name: string;
}

export interface VariantDtls {
    _id: string;
    name: string;
    isActive: boolean;
    createdBy: string;
    modifiedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

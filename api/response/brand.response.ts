export interface Brand {
    name: string;
  }

  export interface BrandDtls {
    _id: string;
    name: string;
    logo: {
        docName: string,
        docPath: string,
        originalName: string
    };
    isActive: boolean;
    createdBy: string;
    modifiedBy: string;
    createdAt: Date;
    updatedAt: Date;
  }

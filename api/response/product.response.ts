export interface ProductDocument {
  _id: string;
  productCode: string;
  categoryId: string;
  subCategory: string;
  childCategory?: string;
  productName: string;
  hsn: string;
  brand: string;
  shortDescription: string;
  slug: string;
  productImage: Array<{
    docName: string;
    docPath: string;
    originalName: string;
  }>;
  additionalImage?: Array<{
    docName: string;
    docPath: string;
    originalName: string;
  }>;
  lowStockAlert: boolean;
  tagAndLabel?: string;
  refundable: boolean;
  productStatus: boolean;
  description?: string;

  applicableForWholesale: boolean;
  wholesalerDiscount: number;
  wholesalerTax: number;

  applicableForCustomer: boolean;
  customerDiscount: number;
  customerTax: number;
  quantityPerPack: number;
  packingType: string,
  isIncentive: boolean,
  showToLineman: boolean,

  wholesalerAttribute: {
    attributeId: any[];
    rowData: any[];
  };
  customerAttribute: {
    attributeId: any[];
    rowData: any[];
  };

  metaTitle: string;
  metaKeyword: string;
  metaDesc: string;

  delivery: string;
  lowStockQuantity: number;
  // vendorId: string;
  isDelete: boolean;
  isActive: boolean;
  createdBy: string;
  modifiedBy: string;

  createdAt: Date;
  updatedAt: Date;
}

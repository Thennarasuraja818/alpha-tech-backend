export interface RootDocumentResponse {
  _id: string;
  rootName: string;
  pincode: { code: string }[];
  salesman: string;
  deliveryCharge: number;
  deliveryman: string;
  crmUser?: string;

  isDelete: boolean;
  isActive: boolean;
  createdBy: string;
  modifiedBy: string;

  createdAt: Date;
  updatedAt: Date;
  variants?: any
}

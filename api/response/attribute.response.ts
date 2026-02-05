export interface Attribute {
  name: string;
  value: string;
}

export interface AttributeDtls {
  _id: string;
  name: string;
  value: any;
  isActive: boolean;
  createdBy: string;
  modifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

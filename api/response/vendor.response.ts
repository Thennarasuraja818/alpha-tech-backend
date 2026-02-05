export interface VendorProduct {
  id?: string;
  label: string;  // Display name
  value: string;  // ID or value
}

export interface Vendor {
  name: string;
  contactPerson: string;
  phoneNumber: string;
  // email: string;
  paymentDueDays: string;
  address: string;
  gstNumber?: string;
  products?: VendorProduct[];
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  alternativeNumber?: string;
  city?: string;
  vendorCode?: string;
  email?: string;
  
  
}

export interface VendorDtls extends Vendor {
  _id: string;
  createdBy: string;
  modifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
  products?: VendorProduct[];
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

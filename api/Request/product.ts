import { z } from 'zod';

export const createProductSchema = z.object({
  categoryId: z.string().min(1, "category is required"),
  subCategory: z.string().min(1, "subCategory is required"),
  // childCategory: z.string().min(1, "childCategory is required"),
  childCategory: z.string().optional(),

  productName: z.string().min(1),
  brand: z.string().min(1),
  shortDescription: z.string().optional(),
  slug: z.string().min(1),

  hsn: z.string()
    .regex(/^\d{2}(\d{2}){0,3}$/, "Invalid HSN code. Must be 2, 4, 6, or 8 digits only."),


  lowStockAlert: z.coerce.boolean().optional(),
  refundable: z.coerce.boolean().optional(),
  productStatus: z.coerce.boolean().optional(),

  tagAndLabel: z.string().optional(),
  description: z.string().optional(),

  applicableForWholesale: z.coerce.boolean().optional(),
  wholesalerDiscount: z.coerce.number().optional(),
  wholesalerTax: z.coerce.number().optional(),

  applicableForCustomer: z.coerce.boolean().optional(),
  customerDiscount: z.coerce.number().optional(),
  customerTax: z.coerce.number().optional(),

  quantityPerPack: z.coerce.number().optional(),
  lowStockQuantity: z.coerce.number().optional(),

  packingType: z.string().optional(),
  isIncentive: z.coerce.boolean().optional(),
  showToLineman: z.coerce.boolean().optional(),

  wholesalerAttribute: z.object({
    attributeId: z.array(z.string()).optional(),
    rowData: z.array(z.any()).optional(),
  }).optional(),

  customerAttribute: z.object({
    attributeId: z.array(z.string()).optional(),
    rowData: z.array(z.any()).optional(),
  }).optional(),

  metaTitle: z.string().optional(),
  metaKeyword: z.string().optional(),
  metaDesc: z.string().optional(),
  delivery: z.string().optional(),
});

export type ProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.extend({
  id: z.string().min(1, "ID is required"),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional().default(''),
  sort: z.enum(['asc', 'desc']).optional().default('asc'),
  type: z.string().optional().default(''),
  categoryId: z.string().optional(),
  offerType: z.string().optional(),
  stockType: z.string().optional(),
  userId: z.string().optional(),

});
export const mobileProductListQuerySchema = z.object({
  offset: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional().default(''),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  sortBy: z.string().optional(),
  page: z.string().optional(),
  type: z.string().optional().default(''),
  id: z.string().optional(),
  priceFromRange: z.string().optional().default(''),
  priceToRange: z.string().optional().default(''),
  userId: z.string().optional(),
  orderId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  orderType: z.string().optional(),
  childCategoryId: z.string().optional(),
  ratingFrom: z.string().optional().default(''),
  ratingTo: z.string().optional().default(''),


});
export type BrandListQuery = z.infer<typeof productListQuerySchema>;

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const calculateDeliveryCharge = (
  rootData: any[] = [],
  productWeight: any,
  quantity: number = 1
): number => {
  // Deep clone and ensure proper object structure
  const data = JSON.parse(JSON.stringify(rootData || []));

  if (!Array.isArray(data) || data.length === 0) {
    console.log('No valid data found');
    return 0;
  }

  const weight = Number(productWeight);
  if (isNaN(weight) || weight <= 0) {
    console.log('Invalid weight');
    return 0;
  }

  for (let i = 0; i < data.length; i++) {
    const variant = data[i];

    // Check all possible ways the properties might be stored
    const from = Number(
      variant?.from ??
      variant?.From ??
      variant?.FROM ??
      (variant && variant['from']) ??
      0
    );

    const to = Number(
      variant?.to ??
      variant?.To ??
      variant?.TO ??
      (variant && variant['to']) ??
      0
    );
    if (weight >= from && weight <= to) {
      // console.log(`✓ MATCH FOUND: ${weight}kg falls in range ${from}-${to}kg`);
      const price = Number(variant?.price || variant?.Price || variant?.PRICE || 0);
      const charge = price * quantity;

      // console.log(`- Price per unit: ${price}`);
      // console.log(`- Quantity: ${quantity}`);
      // console.log(`- Total charge: ${charge}`);

      return charge;
    }
  }
  return 0;
};


/**
 * Find matching product attribute row based on offer attributes
 */
export const findMatchingAttributeRow = (product: any, offerAttributes: any, type: string) => {
  // type = "customer" | "wholesaler"

  const attrBlock =
    type === "customer"
      ? product.customerAttribute?.rowData
      : product.wholesalerAttribute?.rowData;

  if (!attrBlock || !Array.isArray(attrBlock)) return null;

  // offerAttributes = { "Kilo Grams": "683694ee8619d5235aa3a409" }
  const offerAttrKey = Object.keys(offerAttributes)[0];
  const offerAttrVal = offerAttributes[offerAttrKey];

  // Find matching row
  const match = attrBlock.find((row) => {
    return (
      row[offerAttrKey] &&
      row[offerAttrKey].toString() === offerAttrVal.toString()
    );
  });

  return match || null;
};


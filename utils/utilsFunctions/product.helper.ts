
export class ProductHelper {


    static buildAttributeTree(
        attributes: any[],
        rowData: any[],
        attributeIds: string[],
        level = 0,
        parentAttrName?: string,
        parentAttrValue?: string,
        parentId?: string,
        tax: number = 0,
        role?: string
    ): any[] {

        const currentAttrId = attributeIds[level];
        const currentAttr = attributes.find(attr => attr._id.toString() === currentAttrId);
        if (!currentAttr) return [];

        const values = currentAttr.value
            .map((val: any) => {
                const valIdStr = val._id.toString();

                // Check if this value ID exists in any of the row values (as string)
                const matchedValueIds = rowData.flatMap((row: any) =>
                    Object.values(row).filter(val => typeof val === 'string')
                );

                if (!matchedValueIds.includes(valIdStr)) return null;

                // Filter rows that contain this value ID AND match the parent value if needed
                const matchingRows = rowData.filter((row: any) => {
                    const rowValueStrings = Object.values(row).filter(val => typeof val === 'string');
                    const currentMatch = rowValueStrings.includes(valIdStr);

                    const parentMatch = parentAttrName && parentAttrValue
                        ? rowValueStrings.includes(parentAttrValue)
                        : true;

                    return currentMatch && parentMatch;
                });

                if (matchingRows.length === 0) return null;

                const childAttributes =
                    level + 1 < attributeIds.length
                        ? this.buildAttributeTree(
                            attributes,
                            matchingRows,
                            attributeIds,
                            level + 1,
                            currentAttr.name,
                            valIdStr,
                            currentAttr._id,
                            0,
                            role
                        )
                        : [];

                const matchingRow = matchingRows[0];
                const customerTaxPrice = (Number(tax || 0) / 100) * Number(matchingRow?.price || 0);
                const customerTotalTax = customerTaxPrice * 1;
                let price = ''
                switch (role) {
                    case 'Silver':
                        price = (matchingRow?.silver ?? 0).toString()
                        break;
                    case 'Gold':
                        price = (matchingRow?.gold ?? 0).toString()
                        break;
                    case 'Platinum':
                        price = (matchingRow?.platinum ?? 0).toString()
                        break;
                    default:
                        price = (matchingRow?.price ?? 0).toString();
                        break;
                }

                return {
                    value: val.value,
                    _id: val._id,
                    parentId: parentId ?? currentAttr._id,
                    sku: matchingRow?.sku ?? "",
                    // price: tax !== 0 ? ((Number(customerTotalTax) + Number(matchingRow?.price ?? 0))).toString() : (matchingRow?.price ?? 0),
                    price: price,
                    stock: matchingRow?.stock ?? "",
                    maxLimit: matchingRow?.maxLimit ?? "",
                    customerMrp: matchingRow?.customermrp ?? undefined,
                    attributes: childAttributes.length > 0 ? childAttributes : undefined,
                    count: 0,
                    wholesalerMrp: matchingRow?.wholesalermrp ?? "",

                };
            })
            .filter(Boolean);

        if (values.length === 0) return [];

        return [
            {
                _id: currentAttr._id,
                name: currentAttr.name,
                value: values
            }
        ];
    }

}

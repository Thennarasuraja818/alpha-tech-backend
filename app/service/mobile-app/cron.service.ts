import moment from "moment";
import Vendorpurchase from "../../model/vendor.purchase";
import { ProductModel } from "../../model/product";
import ExpiredProductsManagement from "../../model/ExpiredProducts";


export default class CronService {

    async applyExpiryAdjustments() {
        // Anything with expiryDate < cutoff is "expired-before-3-days"
        const cutoff = moment().add(3, 'days').format('YYYY-MM-DD');

        // Pull all purchase-product rows where expiryDate < cutoff
        const expiredRows = await Vendorpurchase.aggregate([
            { $match: { isDelete: false, isActive: true } },
            { $unwind: "$products" },

            {
                $match: {
                    "products.expiryDate": cutoff,          // <-- before 3 days
                    // "products.isProductReceived": true
                }
            },
            {
                // Sum expired qtyReceived *per product + attribute combo*
                $group: {
                    _id: {
                        productId: "$products.id",
                        attributes: "$products.attributes"
                    },
                    expiredQty: { $sum: "$products.quantityReceived" }
                }
            }
        ]);
        console.log(expiredRows, 'expiredRows');

        for (const row of expiredRows) {
            console.log(row, 'row');

            const { productId, attributes } = row._id;
            const expiredQty = row.expiredQty || 0;
            console.log(productId, 'productId');

            const product = await ProductModel.findById(productId);
            console.log(product, 'fff');

            if (!product || !attributes) continue;

            // update both wholesaler & customer attribute stock
            const attrTypes = ['wholesalerAttribute', 'customerAttribute'] as const;

            for (const attrType of attrTypes) {
                const attrData = (product as any)[attrType];
                console.log(attrData, 'attrData');

                if (!attrData?.rowData) continue;

                for (let i = 0; i < attrData.rowData.length; i++) {
                    const r = attrData.rowData[i];
                    console.log(r, 'rrrr');

                    if (!r) continue;

                    // match attributes: ignore meta fields
                    const isMatch = Object.entries(attributes).every(([attrKey, attrVal]) => {
                        // row fields other than these carry attribute values
                        return Object.prototype.hasOwnProperty.call(r, attrKey) &&
                            r[attrKey]?.toString() === attrVal?.toString();
                    });

                    if (!isMatch) continue;

                    // adjust stock
                    const currentStock = Number(r.stock) || 0;
                    const newStock = currentStock <= expiredQty ? 0 : currentStock - expiredQty;

                    console.log(currentStock, newStock, expiredQty, 'sssssssss');

                    attrData.rowData[i].stock = String(newStock);
                    if (currentStock > expiredQty) {

                        const expiredHistory = await ExpiredProductsManagement.create({
                            productId: productId,
                            attributes: attributes,
                            purchasedId: row._id,
                            expiredDate: row.expiryDate,
                            quantityExpired: expiredQty,
                            notes: 'Products will be expired'
                        });
                    }

                    break; // stop scanning rows in this attrType after match
                }
            }

            await ProductModel.findByIdAndUpdate(productId, product, { new: false });
        }
    }
}



  
 export interface OrderWholesalerDetails {
    totalAmount: number;
    orderCode: string;
    creditId: string;
    paidAmount: number;
    paymentStatus: string;
    status: string;
    creditPeriod: number;
    creditLimit: number;
  }

  export interface CreditAmountDetails {
    totalAmount: number;
    orderCode: string;
    creditId: string;
    paidAmount: number;
    paymentStatus: string;
    status: string;
    creditPeriod: number;
    creditLimit: number;
    usedCreditAmount:number;
    availableCreditAmount:number;
    lastPaidedDate:string;
    name:string;
    remaingAmountToPay:number
  }
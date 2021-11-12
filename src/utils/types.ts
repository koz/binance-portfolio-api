export type BinanceTransaction = {
  symbol: string;
  id: number;
  orderId: number;
  orderListId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
};

export type TransactionFiatValue = {
  pair: string;
  fiatValue: number;
};

export type Transaction = {
  symbol: string;
  id: number;
  orderId: number;
  orderListId: number;
  price: number;
  qty: number;
  quoteQty: number;
  commission: number;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
  pair: string;
  fiatValue: number;
};

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

export type BinanceTransactionWPair = BinanceTransaction & {
  pair: string;
};

export type TransactionFiatValue = {
  fiatValue: number;
};

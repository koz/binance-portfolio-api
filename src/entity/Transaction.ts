import { prop } from '@typegoose/typegoose';

export class Transaction {
  @prop({ required: true })
  symbol!: string;

  @prop({ required: true })
  id!: number;

  @prop({ required: true })
  orderId!: number;

  @prop({ required: true })
  orderListId!: number;

  @prop({ required: true })
  price!: number;

  @prop({ required: true })
  qty!: number;

  @prop({ required: true })
  quoteQty!: number;

  @prop({ required: true })
  commission!: number;

  @prop({ required: true })
  commissionAsset!: string;

  @prop({ required: true })
  time!: number;

  @prop({ required: true })
  isBuyer!: boolean;

  @prop({ required: true })
  isMaker!: boolean;

  @prop({ required: true })
  isBestMatch!: boolean;

  @prop({ required: true })
  pair!: string;

  @prop({ required: true })
  fiatValue!: number;
}

import { prop } from '@typegoose/typegoose';
import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class Pair {
  @Field()
  @prop({ required: true })
  symbol!: string;

  @Field()
  @prop({ required: true })
  baseAsset!: string;

  @Field()
  @prop({ required: true })
  quoteAsset!: string;
}

@ObjectType()
export class ExchangeInfo {
  @Field(() => [Pair])
  @prop({ type: () => [Pair], required: true, _id: false })
  pairs!: Pair[];

  @Field()
  @prop({ required: true })
  name!: string;
}

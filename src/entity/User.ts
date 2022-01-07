import { Field, ObjectType } from 'type-graphql';
import { Transaction } from './Transaction';
import { prop } from '@typegoose/typegoose';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class Token {
  @Field()
  @prop({ required: true })
  token!: string;

  @Field()
  @prop({ required: true })
  qty!: number;

  @Field()
  @prop({ required: true })
  investimentValue!: number;

  @Field()
  @prop()
  currentFiatValue?: number;

  @Field()
  @prop({ required: true })
  currentTotalValue!: number;
}

@ObjectType()
export class User {
  @Field()
  _id!: string;

  @Field()
  @prop({ unique: true, required: true })
  email!: string;

  @prop({ required: true })
  password!: string;

  @prop({ required: true })
  binanceApiKey!: string;

  @prop({ required: true })
  binanceSecretKey!: string;

  @Field(() => [String])
  @prop({ type: () => [String] })
  pairs: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  @prop({ _id: false, type: () => Token })
  tokens!: Token[];

  @prop({ _id: false, type: () => [[Transaction]] })
  transactions: Transaction[][];

  @prop()
  transactionsLastUpdated: number;
}

import { ObjectType, Field } from 'type-graphql';
import { FieldError } from './FieldError';
import { ExchangeInfo } from '../entity/ExchangeInfo';

@ObjectType()
export class ExchangeResponse {
  @Field(() => ExchangeInfo, { nullable: true })
  exchange?: ExchangeInfo;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

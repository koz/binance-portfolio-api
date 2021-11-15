import { Token } from '../entity/User';
import { ObjectType, Field } from 'type-graphql';
import { FieldError } from './FieldError';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class TokensResponse {
  @Field(() => GraphQLJSON, { nullable: true })
  tokens?: [Token];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

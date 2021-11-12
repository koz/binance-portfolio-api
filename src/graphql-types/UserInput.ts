import { InputType, Field } from 'type-graphql';
import { AuthInput } from './AuthInput';

@InputType()
export class UserInput extends AuthInput {
  @Field()
  binanceKey: string;

  @Field()
  binanceSecretKey: string;
}

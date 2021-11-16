import { InputType, Field } from 'type-graphql';
import { AuthInput } from './AuthInput';

@InputType()
export class UserInput extends AuthInput {
  @Field(() => String)
  binanceKey: string;

  @Field(() => String)
  binanceSecretKey: string;
}

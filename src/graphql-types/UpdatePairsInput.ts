import { InputType, Field } from 'type-graphql';

@InputType()
export class UpdatePairsInput {
  @Field(() => [String])
  pairs: string[];
}

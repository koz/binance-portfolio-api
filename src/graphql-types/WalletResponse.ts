import { ObjectType, Field } from "type-graphql";
import { FieldError } from "./FieldError";
import { Wallet } from "../entity/Wallet";

@ObjectType()
export class WalletResponse {
  @Field(() => Wallet, { nullable: true })
  wallet?: Wallet;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

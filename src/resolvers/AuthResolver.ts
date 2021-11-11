import bcrypt from "bcryptjs";
import { Arg, Ctx, Mutation, Resolver, Query } from "type-graphql";
import { User } from "../entity/User";
import { UserInput } from "../graphql-types/UserInput";
import { AuthInput } from "../graphql-types/AuthInput";
import { MyContext } from "../graphql-types/MyContext";
import { UserResponse } from "../graphql-types/UserResponse";
import { Wallet } from "../entity/Wallet";

const invalidLoginResponse = {
  errors: [
    {
      path: "email",
      message: "invalid login"
    }
  ]
};

@Resolver()
export class AuthResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg("input")
    { email, password, binanceKey, binanceSecretKey }: UserInput
  ): Promise<UserResponse> {
    const hashedPassword = await bcrypt.hash(password, 12);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return {
        errors: [
          {
            path: "email",
            message: "already in use"
          }
        ]
      };
    }

    const wallet = await Wallet.create().save()

    const user = await User.create({
      email,
      password: hashedPassword,
      binanceApiKey: binanceKey,
      binanceSecretKey,
      wallet,
    }).save();

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("input") { email, password }: AuthInput,
    @Ctx() ctx: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return invalidLoginResponse;
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return invalidLoginResponse;
    }

    ctx.req.session!.userId = user.id;

    return { user };
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: MyContext): Promise<User | undefined> {
    const userId = ctx.req.session!.userId;
    if (!userId) {
      return undefined;
    }

    return User.findOne(userId, {relations: ["wallet"]});
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() ctx: MyContext): Promise<Boolean> {
    return new Promise((res, rej) =>
      ctx.req.session!.destroy(err => {
        if (err) {
          console.log(err);
          return rej(false);
        }

        ctx.res.clearCookie("qid");
        return res(true);
      })
    );
  }
}

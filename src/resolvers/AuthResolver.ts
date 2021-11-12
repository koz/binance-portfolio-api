import bcrypt from 'bcryptjs';
import { Arg, Ctx, Mutation, Resolver, Query } from 'type-graphql';
import { User } from '../entity/User';
import { UserInput } from '../graphql-types/UserInput';
import { AuthInput } from '../graphql-types/AuthInput';
import { MyContext } from '../graphql-types/MyContext';
import { UserResponse } from '../graphql-types/UserResponse';
import { Wallet } from '../entity/Wallet';
import { UpdatePairsInput } from '../graphql-types/UpdatePairsInput';
import { invalidLoginResponse, notAuthenticatedResponse, userNotFoundResponse } from '../utils/ErrorsReponses';

@Resolver()
export class AuthResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg('input')
    { email, password, binanceKey, binanceSecretKey }: UserInput
  ): Promise<UserResponse> {
    const hashedPassword = await bcrypt.hash(password, 12);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return {
        errors: [
          {
            path: 'email',
            message: 'already in use',
          },
        ],
      };
    }

    const wallet = await Wallet.create().save();

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
  async login(@Arg('input') { email, password }: AuthInput, @Ctx() ctx: MyContext): Promise<UserResponse> {
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

  @Mutation(() => UserResponse)
  async updatePairs(@Arg('input') { pairs }: UpdatePairsInput, @Ctx() ctx: MyContext): Promise<UserResponse> {
    const userId = ctx.req.session.userId;

    if (!userId) {
      return userNotFoundResponse;
    }

    const user = await User.findOne(userId);

    if (!user) {
      return notAuthenticatedResponse;
    }

    user.pairs = pairs;

    await user.save();

    return { user };
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: MyContext): Promise<UserResponse> {
    const userId = ctx.req.session!.userId;
    if (!userId) {
      return notAuthenticatedResponse;
    }

    const user = await User.findOne(userId, { relations: ['wallet'] });

    if (!user) {
      return userNotFoundResponse;
    }

    return { user };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() ctx: MyContext): Promise<Boolean> {
    return new Promise((res, rej) =>
      ctx.req.session!.destroy((err) => {
        if (err) {
          console.log(err);
          return rej(false);
        }

        ctx.res.clearCookie('qid');
        return res(true);
      })
    );
  }
}

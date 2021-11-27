import bcrypt from 'bcryptjs';
import { Arg, Ctx, Mutation, Resolver, Query } from 'type-graphql';
import { User } from '../entity/User';
import { UserInput } from '../graphql-types/UserInput';
import { AuthInput } from '../graphql-types/AuthInput';
import { MyContext } from '../graphql-types/MyContext';
import { UserResponse } from '../graphql-types/UserResponse';
import { UpdatePairsInput } from '../graphql-types/UpdatePairsInput';
import { invalidLoginResponse, notAuthenticatedResponse, userNotFoundResponse } from '../utils/errorsReponses';
import { getModelForClass } from '@typegoose/typegoose';
import { decryptMessage } from '../utils/decrypt';

const UserModel = getModelForClass(User);

@Resolver()
export class AuthResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg('input')
    { email, password, binanceKey, binanceSecretKey }: UserInput
  ): Promise<UserResponse> {
    const hashedPassword = await bcrypt.hash(password, 12);

    const existingUser = await UserModel.findOne({ email }).exec();

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

    const user = await UserModel.create({
      email,
      password: hashedPassword,
      binanceApiKey: decryptMessage(binanceKey),
      binanceSecretKey: decryptMessage(binanceSecretKey),
    });

    await user.save();

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(@Arg('input') { email, password }: AuthInput, @Ctx() ctx: MyContext): Promise<UserResponse> {
    const user = await UserModel.findOne({ email }).exec();

    if (!user) {
      return invalidLoginResponse;
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return invalidLoginResponse;
    }

    ctx.req.session!.userId = user._id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async updatePairs(@Arg('input') { pairs }: UpdatePairsInput, @Ctx() ctx: MyContext): Promise<UserResponse> {
    const userId = ctx.req.session.userId;

    if (!userId) {
      return userNotFoundResponse;
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return notAuthenticatedResponse;
    }

    user.pairs = pairs;

    await user.save();

    return { user };
  }

  @Query(() => UserResponse, { nullable: true })
  async me(@Ctx() ctx: MyContext): Promise<UserResponse> {
    const userId = ctx.req.session!.userId;
    if (!userId) {
      return notAuthenticatedResponse;
    }

    const user = await UserModel.findById(userId);

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

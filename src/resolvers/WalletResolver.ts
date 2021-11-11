import { User } from "../entity/User";
import { Wallet } from "../entity/Wallet";
import { MyContext } from "../graphql-types/MyContext";
import { WalletResponse } from "../graphql-types/WalletResponse";
import { Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import BinanceApiClient from '../api/index'

@Resolver()
export class WalletResolver {
  @Query(() => WalletResponse)
  @UseMiddleware(isAuth)
  async wallet(@Ctx() ctx: MyContext) {
    const userId = ctx.req.session!.userId;
    const user = await User.findOne(userId);
    const wallet = await Wallet.findOne({where: {
      user: {
        id: userId
      }
    }})

    if (!user) {
      return {
        errors: [
          {
            path: "user",
            message: "user not found"
          }
        ]
      };
    }

    if (!wallet) {
      return {
        errors: [
          {
            path: "user",
            message: "no wallet found for this user"
          }
        ]
      };
    }

    const apiClient = new BinanceApiClient(user.binanceApiKey, user.binanceSecretKey);

    const pairsList = user.pairs;

    if (!pairsList) {
      return { wallet }
    }

    const assetTransactions = await apiClient.getPairsTransactions(pairsList);

    const transactionsWithFiatValue = await apiClient.getTransactionsFiatValue(assetTransactions);

    const walletFromApi: Record<string, {
      qty: number,
      investimentValue: number,
      currentFiatValue: number,
      currentTotalValue: number
    }> = {}

    for (const transactions of transactionsWithFiatValue) {
      for (const t of transactions) {
        const parsedPair = t.pair.split('/');
        const boughtCurrency = parsedPair[0];
        const qty = Number(t.qty);
        const transactionQty = qty * (t.isBuyer ? 1 : -1);
        const transactionFiatValue = Number(t.fiatValue) * (t.isBuyer ? 1 : -1);
        const investimentValue = transactionFiatValue * transactionQty;

        if (!walletFromApi[boughtCurrency]) {
          const currentFiatValue = Number(await apiClient.getCurrentFiatValue(boughtCurrency));
          walletFromApi[boughtCurrency] = {
            qty,
            investimentValue,
            currentFiatValue,
            currentTotalValue: currentFiatValue * qty,
          };
        } else {
          walletFromApi[boughtCurrency].qty += transactionQty;
          walletFromApi[boughtCurrency].investimentValue += investimentValue;
          walletFromApi[boughtCurrency].currentTotalValue = walletFromApi[boughtCurrency].currentFiatValue * walletFromApi[boughtCurrency].qty;
        }
      }
    }

    wallet.tokens = walletFromApi;
    await wallet.save();

    return {
      wallet
    }
  }
}

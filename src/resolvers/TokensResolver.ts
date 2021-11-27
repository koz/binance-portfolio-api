import { Token, User } from '../entity/User';
import { MyContext } from '../graphql-types/MyContext';
import { TokensResponse } from '../graphql-types/TokensResponse';
import { Ctx, Query, Resolver, UseMiddleware } from 'type-graphql';
import { isAuth } from '../middleware/isAuth';
import BinanceApiClient from '../api/index';
import { userNotFoundResponse, tokensNotFound } from '../utils/errorsReponses';
import { BinanceTransaction, TransactionFiatValue } from '../utils/types';
import { Transaction } from '../entity/Transaction';
import { getModelForClass } from '@typegoose/typegoose';

const UserModel = getModelForClass(User);

const formatTransactions = (transactions: (BinanceTransaction & TransactionFiatValue)[][]): Transaction[][] =>
  transactions.map((pair) =>
    pair.map(
      ({
        symbol,
        id,
        orderId,
        orderListId,
        price,
        qty,
        quoteQty,
        commission,
        commissionAsset,
        time,
        isBuyer,
        isMaker,
        isBestMatch,
        pair,
        fiatValue,
      }) => ({
        symbol,
        id,
        orderId,
        orderListId,
        price: Number(price),
        qty: Number(qty),
        quoteQty: Number(quoteQty),
        commission: Number(commission),
        commissionAsset: commissionAsset,
        time: time,
        isBuyer: isBuyer,
        isMaker: isMaker,
        isBestMatch: isBestMatch,
        pair: pair,
        fiatValue: Number(fiatValue),
      })
    )
  );

@Resolver()
export class TokensResolver {
  @Query(() => TokensResponse)
  @UseMiddleware(isAuth)
  async updatedTokens(@Ctx() ctx: MyContext) {
    const userId = ctx.req.session!.userId;
    const user = await UserModel.findById(userId);
    const pairs = user?.pairs;

    if (!user) {
      return userNotFoundResponse;
    }

    if (!pairs) {
      return tokensNotFound;
    }

    const apiClient = new BinanceApiClient(user.binanceApiKey, user.binanceSecretKey);

    if (!user.transactionsLastUpdated || Date.now() > user.transactionsLastUpdated + 60000 * 5) {
      const assetTransactions = await apiClient.getPairsTransactions(pairs, user.transactionsLastUpdated);

      const nonEmptyTransactions = assetTransactions.filter((s) => s.filter((x) => x).length);

      const transactionsWithFiatValue = await apiClient.getTransactionsFiatValue(nonEmptyTransactions);

      const parsedTransactions = formatTransactions(transactionsWithFiatValue);

      user.transactions = user.transactions ? [...user.transactions, ...parsedTransactions] : parsedTransactions;
      user.transactionsLastUpdated = Date.now();
    }

    const tokensFromApi: Record<string, Token> = {};

    for (const transactions of user.transactions) {
      for (const t of transactions) {
        const parsedPair = t.pair.split('/');
        const boughtCurrency = parsedPair[0];
        const qty = t.qty;
        const transactionQty = qty * (t.isBuyer ? 1 : -1);
        const transactionFiatValue = t.fiatValue * (t.isBuyer ? 1 : -1);
        const investimentValue = transactionFiatValue * transactionQty;

        if (!tokensFromApi[boughtCurrency]) {
          const currentFiatValue = Number(await apiClient.getCurrentFiatValue(boughtCurrency));
          tokensFromApi[boughtCurrency] = {
            token: boughtCurrency,
            qty,
            investimentValue,
            currentFiatValue,
            currentTotalValue: currentFiatValue * qty,
          };
        } else {
          tokensFromApi[boughtCurrency].qty += transactionQty;
          tokensFromApi[boughtCurrency].investimentValue += investimentValue;
          tokensFromApi[boughtCurrency].currentTotalValue =
            tokensFromApi[boughtCurrency].currentFiatValue * tokensFromApi[boughtCurrency].qty;
        }
      }
    }

    user.tokens = Object.keys(tokensFromApi).map((key) => tokensFromApi[key]);

    await user.save();

    return {
      tokens: user.tokens,
    };
  }
}

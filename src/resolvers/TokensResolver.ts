import { Token, User } from '../entity/User';
import { MyContext } from '../graphql-types/MyContext';
import { TokensResponse } from '../graphql-types/TokensResponse';
import { Ctx, Query, Resolver, UseMiddleware } from 'type-graphql';
import { isAuth } from '../middleware/isAuth';
import BinanceApiClient from '../api/index';
import { userNotFoundResponse, tokensNotFound } from '../utils/errorsReponses';
import { BinanceTransactionWPair, TransactionFiatValue } from '../utils/types';
import { Transaction } from '../entity/Transaction';
import { getModelForClass } from '@typegoose/typegoose';

const UserModel = getModelForClass(User);

const formatTransactions = (transactions: (BinanceTransactionWPair & TransactionFiatValue)[][]): Transaction[][] =>
  transactions.map((pair) =>
    pair.map((p) => ({
      ...p,
      price: Number(p.price),
      qty: Number(p.qty),
      quoteQty: Number(p.quoteQty),
      commission: Number(p.commission),
      fiatValue: Number(p.fiatValue),
    }))
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

    const assetTransactions = await apiClient.getPairsTransactions(pairs);

    const nonEmptyTransactions = assetTransactions.filter((s) => s.filter((x) => x).length);

    const transactionsWithFiatValue = await apiClient.getTransactionsFiatValue(nonEmptyTransactions);

    const parsedTransactions = formatTransactions(transactionsWithFiatValue);

    user.transactions = parsedTransactions;
    user.transactionsLastUpdated = Date.now();

    const tokensFromApi: Record<string, Token> = {};

    for (const transactions of user.transactions) {
      for (const t of transactions) {
        const parsedPair = t.pair.split('/');
        const boughtAsset = parsedPair[0];
        const baseAsset = parsedPair[1];
        const qty = t.qty;
        const transactionQty = qty * (t.isBuyer ? 1 : -1);
        const transactionFiatValue = t.fiatValue * (t.isBuyer ? 1 : -1);
        const investimentValue = transactionFiatValue * transactionQty;

        if (!tokensFromApi[boughtAsset]) {
          tokensFromApi[boughtAsset] = {
            token: boughtAsset,
            qty,
            investimentValue,
            currentTotalValue: 0,
          };
        } else {
          tokensFromApi[boughtAsset].qty += transactionQty;
          tokensFromApi[boughtAsset].investimentValue += investimentValue;
        }

        if (!tokensFromApi[baseAsset]) {
          tokensFromApi[baseAsset] = {
            token: baseAsset,
            qty: t.quoteQty * -1,
            investimentValue: 0,
            currentTotalValue: 0,
          };
        } else {
          tokensFromApi[baseAsset].qty -= t.quoteQty;
        }
      }
    }

    user.tokens = await Promise.all(
      Object.keys(tokensFromApi).map(async (key) => {
        const currentFiatValue = Number(await apiClient.getCurrentFiatValue(key));
        tokensFromApi[key].currentFiatValue = currentFiatValue;
        tokensFromApi[key].currentTotalValue = tokensFromApi[key].qty * currentFiatValue;
        return tokensFromApi[key];
      })
    );

    await user.save();

    return {
      tokens: user.tokens,
    };
  }
}

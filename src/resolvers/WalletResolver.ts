import { User } from '../entity/User';
import { Wallet } from '../entity/Wallet';
import { MyContext } from '../graphql-types/MyContext';
import { WalletResponse } from '../graphql-types/WalletResponse';
import { Ctx, Query, Resolver, UseMiddleware } from 'type-graphql';
import { isAuth } from '../middleware/isAuth';
import BinanceApiClient from '../api/index';
import { userNotFoundResponse, walletNotFound } from '../utils/ErrorsReponses';
import { BinanceTransaction, Transaction, TransactionFiatValue } from '../utils/types';

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
export class WalletResolver {
  @Query(() => WalletResponse)
  @UseMiddleware(isAuth)
  async wallet(@Ctx() ctx: MyContext) {
    const userId = ctx.req.session!.userId;
    const user = await User.findOne(userId);
    const wallet = await Wallet.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!user) {
      return userNotFoundResponse;
    }

    if (!wallet) {
      return walletNotFound;
    }

    const apiClient = new BinanceApiClient(user.binanceApiKey, user.binanceSecretKey);

    const pairsList = user.pairs;

    if (!pairsList) {
      return { wallet };
    }

    if (!user.transactionsLastUpdated || Date.now() > user.transactionsLastUpdated + 60000 * 5) {
      console.log('updating transactions')
      const assetTransactions = await apiClient.getPairsTransactions(pairsList, user.transactionsLastUpdated);

      const transactionsWithFiatValue = await apiClient.getTransactionsFiatValue(assetTransactions);

      const parsedTransactions = formatTransactions(transactionsWithFiatValue);

      user.transactions = user.transactions ? [...user.transactions, ...parsedTransactions] : parsedTransactions;
      user.transactionsLastUpdated = Date.now();
      await user.save();
    }

    const walletFromApi: Record<
      string,
      {
        qty: number;
        investimentValue: number;
        currentFiatValue: number;
        currentTotalValue: number;
      }
    > = {};

    for (const transactions of user.transactions) {
      for (const t of transactions) {
        const parsedPair = t.pair.split('/');
        const boughtCurrency = parsedPair[0];
        const qty = t.qty;
        const transactionQty = qty * (t.isBuyer ? 1 : -1);
        const transactionFiatValue = t.fiatValue * (t.isBuyer ? 1 : -1);
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
          walletFromApi[boughtCurrency].currentTotalValue =
            walletFromApi[boughtCurrency].currentFiatValue * walletFromApi[boughtCurrency].qty;
        }
      }
    }

    wallet.tokens = walletFromApi;
    await wallet.save();

    return {
      wallet,
    };
  }
}

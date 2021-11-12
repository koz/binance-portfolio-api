import { BinaryLike } from 'crypto';
import { BinanceTransaction, TransactionFiatValue } from '../utils/types';

import { unsignedGet, signedGet } from './utils';

export default class BinanceApiClient {
  constructor(publicKey: string, secretKey: BinaryLike) {
    this.publicKey = publicKey;
    this.secretKey = secretKey;
  }

  private publicKey: string;
  private secretKey: BinaryLike;

  public getPairTransactions = (pair: string, startTime?: number) => {
    const parsedPair = pair.replace('/', '');
    const params: {
      symbol: string,
      startTime?: number
    } = {
      symbol: parsedPair
    }

    if (startTime) {
      params.startTime = startTime
    }

    return signedGet(
      'myTrades',
      params,
      this.publicKey,
      this.secretKey
    );
  };

  public getPairsTransactions = (pairs: string[], startTime?: number): Promise<BinanceTransaction[][]> =>
    Promise.all(pairs.map((pair) => this.getPairTransactions(pair, startTime)))

  public getTransactionsFiatValue = (
    transactionsList: BinanceTransaction[][]
  ): Promise<(BinanceTransaction & TransactionFiatValue)[][]> =>
    Promise.all(
      transactionsList.map(async (transactions) => {
        const {commissionAsset, symbol, isMaker} = transactions[0];
        const buyCurrency = isMaker ? commissionAsset : symbol.replace(commissionAsset, '');
        const regex = new RegExp(`(^\\w+)(${buyCurrency}$)`)
        const pair = transactions[0].symbol.replace(regex, '$1/$2')
        const buyCurrencyWithFiat = `${buyCurrency}EUR`;
        if (buyCurrency === 'EUR') {
          return transactions.map((t: BinanceTransaction): BinanceTransaction & TransactionFiatValue => ({
            ...t,
            pair,
            fiatValue: Number(t.price),
          }));
        }
        return await Promise.all(
          transactions.map(async (t: BinanceTransaction): Promise<BinanceTransaction & TransactionFiatValue> => {
            const fiatValue = await unsignedGet('klines', {
              interval: '1m',
              startTime: t.time,
              endTime: t.time + 60000,
              symbol: buyCurrencyWithFiat,
            }).then((data: (string | number)[][]) => data[0][4]);
            return {
              ...t,
              pair,
              fiatValue: Number(t.price) * Number(fiatValue),
            };
          })
        );
      })
    );

  public getCurrentFiatValue = async (symbol: string): Promise<number> => {
    const pair = `${symbol}EUR`;
    const time = Date.now();
    const fiatValue = await unsignedGet('klines', {
      interval: '1m',
      startTime: time - 60000,
      endTime: time - 1,
      symbol: pair,
    }).then((data: (string | number)[][]) => {
      if (data[0] && data[0][4]) {
        return Number(data[0][4]);
      }
      return 0;
    });
    return fiatValue;
  };
}

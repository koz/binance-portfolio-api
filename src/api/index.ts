import { BinaryLike } from "crypto";

const { unsignedGet, signedGet } = require('./utils');

export default class BinanceApiClient {
  constructor(publicKey: string, secretKey: BinaryLike) {
    this.publicKey = publicKey
    this.secretKey = secretKey
  }

  private publicKey: string;
  private secretKey: BinaryLike;

  public getPairTransactions = (pair: string) => {
    const parsedPair = pair.replace('/', '');
    return signedGet('myTrades', {
      symbol: parsedPair,
    }, this.publicKey, this.secretKey);
  };

  public getPairsTransactions = (pairs: string[]) =>
  Promise.all(pairs.map((pair) => this.getPairTransactions(pair))).then((transactions) =>
    // Turn it into an object so we don't loose the pair -> transactions reference.
    pairs.reduce((accum: Record<string, Record<string,any>>, pair: string, index: number): Record<string, Record<string, any>> => {
      accum[pair] = transactions[index];
      return accum;
    }, {})
  );

  public getTransactionsFiatValue = (transactionsList: Record<string, Record<string, any>>) =>
  Promise.all(
    Object.keys(transactionsList).map(async (c) => {
      const parsedPair = c.split('/');
      const buyCurrency = parsedPair[1];
      const buyCurrencyWithFiat = `${buyCurrency}EUR`;
      const transactions = transactionsList[c];
      if (buyCurrency === 'EUR') {
        return transactions.map((t: any) => ({
          ...t,
          pair: c,
          fiatValue: t.price,
        }));
      }
      return await Promise.all(
        transactions.map(async (t: any) => {
          const fiatValue = await unsignedGet('klines', {
            interval: '1m',
            startTime: t.time,
            endTime: t.time + 60000,
            symbol: buyCurrencyWithFiat,
          }).then((data: (string | number)[][]) => data[0][4]);
          return {
            ...t,
            pair: c,
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
        return data[0][4];
      }
      return 0
    });
    return fiatValue;
  };
}

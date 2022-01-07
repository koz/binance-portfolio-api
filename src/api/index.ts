import { getModelForClass } from '@typegoose/typegoose';
import { BinaryLike } from 'crypto';
import { ExchangeInfo } from '../entity/ExchangeInfo';
import { BinanceTransaction, BinanceTransactionWPair, TransactionFiatValue } from '../utils/types';

import { unsignedGet, signedGet } from './utils';

const ExchangeInfoModel = getModelForClass(ExchangeInfo);

export default class BinanceApiClient {
  constructor(publicKey?: string, secretKey?: BinaryLike) {
    this.publicKey = publicKey;
    this.secretKey = secretKey;
  }

  private publicKey?: string;
  private secretKey?: BinaryLike;

  public getPairTransactions = (pair: string, startTime?: number) => {
    if (!this.publicKey || !this.secretKey) {
      throw Error('Missing api key');
    }

    const parsedPair = pair.replace('/', '');
    const params: {
      symbol: string;
      startTime?: number;
    } = {
      symbol: parsedPair,
    };

    if (startTime) {
      params.startTime = startTime;
    }

    return signedGet('myTrades', params, this.publicKey, this.secretKey);
  };

  public getPairsTransactions = (pairs: string[], startTime?: number): Promise<BinanceTransactionWPair[][]> =>
    Promise.all(
      pairs.map((pair) =>
        this.getPairTransactions(pair, startTime).then((t: BinanceTransaction[]): BinanceTransactionWPair[] =>
          t.map((t1) => ({
            ...t1,
            pair,
          }))
        )
      )
    );

  public getTransactionsFiatValue = (
    transactionsList: BinanceTransactionWPair[][]
  ): Promise<(BinanceTransactionWPair & TransactionFiatValue)[][]> =>
    Promise.all(
      transactionsList.map(async (transactions) => {
        const { pair } = transactions[0];
        const parsedPair = pair.split('/');
        const buyCurrency = parsedPair[1];
        const binanceInfo = await ExchangeInfoModel.findOne({ name: 'binance' });
        const hasEurPair = binanceInfo?.pairs.find((p) => p.baseAsset === parsedPair[1] && p.quoteAsset === 'EUR');
        const buyCurrencyWithFiat = `${buyCurrency}EUR`;

        if (buyCurrency === 'EUR') {
          return transactions.map((t: BinanceTransactionWPair): BinanceTransactionWPair & TransactionFiatValue => ({
            ...t,
            fiatValue: Number(t.price),
          }));
        }

        if (!hasEurPair) {
          return transactions.map((t: BinanceTransactionWPair): BinanceTransactionWPair & TransactionFiatValue => ({
            ...t,
            fiatValue: 0,
          }));
        }

        return await Promise.all(
          transactions.map(
            async (t: BinanceTransactionWPair): Promise<BinanceTransactionWPair & TransactionFiatValue> => {
              const fiatValue = await unsignedGet('klines', {
                interval: '1m',
                startTime: t.time,
                endTime: t.time + 60000,
                symbol: buyCurrencyWithFiat,
              }).then((data: (string | number)[][]) => data[0][4]);
              return {
                ...t,
                fiatValue: Number(t.price) * Number(fiatValue),
              };
            }
          )
        );
      })
    );

  public getCurrentFiatValue = async (pair: string): Promise<number> => {
    const parsedPair = pair.split('/');
    const boughtAsset = parsedPair[0];
    const binanceInfo = await ExchangeInfoModel.findOne({ name: 'binance' });
    const hasEurPair = binanceInfo?.pairs.find((p) => p.baseAsset === parsedPair[0] && p.quoteAsset === 'EUR');
    const time = Date.now();

    let fiatValue = 0;
    if (hasEurPair) {
      fiatValue = await unsignedGet('klines', {
        interval: '1m',
        startTime: time - 60000,
        endTime: time - 1,
        symbol: `${boughtAsset}EUR`,
      }).then((data: (string | number)[][]) => {
        if (data[0] && data[0][4]) {
          return Number(data[0][4]);
        }
        return 0;
      });
    } else if (binanceInfo?.pairs.find((p) => p.baseAsset === parsedPair[0] && p.quoteAsset === 'BTC')) {
      const currentValueInBTC = await unsignedGet('klines', {
        interval: '1m',
        startTime: time - 60000,
        endTime: time - 1,
        symbol: `${boughtAsset}BTC`,
      }).then((data: (string | number)[][]) => {
        if (data[0] && data[0][4]) {
          return Number(data[0][4]);
        }
        return 0;
      });

      const currentBTCValue = await unsignedGet('klines', {
        interval: '1m',
        startTime: time - 60000,
        endTime: time - 1,
        symbol: 'BTCEUR',
      }).then((data: (string | number)[][]) => {
        if (data[0] && data[0][4]) {
          return Number(data[0][4]);
        }
        return 0;
      });

      fiatValue = currentValueInBTC * currentBTCValue;
    }

    return fiatValue;
  };

  public getExchangeInfo = async (): Promise<any> => await unsignedGet('exchangeInfo');
}

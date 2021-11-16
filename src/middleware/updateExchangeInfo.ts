import { getModelForClass } from '@typegoose/typegoose';
import { Request, Response, NextFunction } from 'express';
import { ExchangeInfo, Pair } from '../entity/ExchangeInfo';
import BinanceApiClient from '../api';

// @ts-ignore
export const updateExchangeInfo = async (req: Request, res: Response, next: NextFunction) => {
  const apiClient = new BinanceApiClient();

  const pairs = await apiClient.getExchangeInfo().then((data) =>
    data.symbols
      ? data.symbols.map(
          (p: any): Pair => ({
            symbol: p.symbol,
            quoteAsset: p.quoteAsset,
            baseAsset: p.baseAsset,
          })
        )
      : []
  );

  const ExchangeInfoModel = getModelForClass(ExchangeInfo);
  const binanceInfo = await ExchangeInfoModel.findOne({ name: 'binance' });
  if (!binanceInfo) {
    const exchangeInfo = await ExchangeInfoModel.create({
      name: 'binance',
      pairs,
    });

    await exchangeInfo.save();
  } else {
    binanceInfo.pairs = pairs;
    await binanceInfo.save();
  }
  next();
};

import { ExchangeResponse } from '../graphql-types/ExchangeResponse';
import { Query, Resolver } from 'type-graphql';
import { getModelForClass } from '@typegoose/typegoose';
import { ExchangeInfo } from '../entity/ExchangeInfo';

const ExchangeInfoModel = getModelForClass(ExchangeInfo);

@Resolver()
export class ExchangeResolver {
  @Query(() => ExchangeResponse)
  async exchangeInfo() {
    const binanceInfo = await ExchangeInfoModel.findOne({ name: 'binance' });
    return {
      exchange: binanceInfo,
    };
  }
}

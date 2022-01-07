import axios, { AxiosError, AxiosResponse } from 'axios';
import { BinaryLike } from 'crypto';
import { signature } from '../utils/signature';

const API_URL = 'https://api.binance.com/api/v3';

const getURL = (endpoint: string): string => `${API_URL}/${endpoint}`;

const responseHandler = (response: AxiosResponse): any => response.data;
// TODO: Implement error handling
const errorHandler = ({ response }: AxiosError): void => {
  console.log(response);
};

const getQueryString = (params: Record<string, string>) => new URLSearchParams(params).toString();

// Used for private endpoints, such as user data
export const signedGet = (endpoint: string, params = {}, publicKey: string, secretKey: BinaryLike): Promise<any> => {
  const timestamp = Date.now();
  const paramsWithTimestamp = {
    ...params,
    timestamp: `${timestamp}`,
  };
  return axios
    .get(getURL(endpoint), {
      headers: {
        ['X-MBX-APIKEY']: publicKey || '',
      },
      params: {
        ...paramsWithTimestamp,
        signature: signature(getQueryString(paramsWithTimestamp), secretKey),
      },
    })
    .then(responseHandler)
    .catch(errorHandler);
};

// Used for public endpoint, such as kline/candlestick data
export const unsignedGet = (endpoint: string, params = {}) =>
  axios.get(getURL(endpoint), { params }).then(responseHandler).catch(errorHandler);

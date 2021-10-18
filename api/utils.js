const axios = require('axios');
const { signature } = require('../signature');

const API_URL = 'https://api.binance.com/api/v3';
const API_KEY = process.env.BINANCE_API_KEY;

const getURL = (endpoint) => `${API_URL}/${endpoint}`;

const responseHandler = (response) => response.data;
// TODO: Implement error handling
const errorHandler = ({ response }) => {
  console.log(response.data);
};

const getQueryString = (params) => new URLSearchParams(params).toString();

// Used for private endpoints, such as user data
const signedGet = (endpoint, params = {}) => {
  const timestamp = Date.now();
  const paramsWithTimestamp = {
    ...params,
    timestamp,
  };
  return axios
    .get(getURL(endpoint), {
      headers: {
        ['X-MBX-APIKEY']: API_KEY,
      },
      params: {
        ...paramsWithTimestamp,
        signature: signature(getQueryString(paramsWithTimestamp)),
      },
    })
    .then(responseHandler)
    .catch(errorHandler);
};

// Used for public endpoint, such as kline/candlestick data
const unsignedGet = (endpoint, params = {}) =>
  axios.get(getURL(endpoint), { params }).then(responseHandler).catch(errorHandler);

module.exports = {
  signedGet,
  unsignedGet,
};

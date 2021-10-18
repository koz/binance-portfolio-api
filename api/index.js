const { unsignedGet, signedGet } = require('./utils');

const getPairTransactions = (pair) => {
  const parsedPair = pair.replace('/', '');
  return signedGet('myTrades', {
    symbol: parsedPair,
  });
};

const getPairsTransactions = (pairs) =>
  Promise.all(pairs.map((pair) => getPairTransactions(pair))).then((transactions) =>
    // Turn it into an object so we don't loose the pair -> transactions reference.
    pairs.reduce((accum, pair, index) => {
      accum[pair] = transactions[index];
      return accum;
    }, {})
  );

const getTransactionsFiatValue = (transactionsList) =>
  Promise.all(
    Object.keys(transactionsList).map(async (c) => {
      const parsedPair = c.split('/');
      const buyCurrency = parsedPair[1];
      const buyCurrencyWithFiat = `${buyCurrency}EUR`;
      const transactions = transactionsList[c];
      if (buyCurrency === 'EUR') {
        return transactions.map((t) => ({
          ...t,
          pair: c,
          fiatValue: t.price,
        }));
      }
      return await Promise.all(
        transactions.map(async (t) => {
          const fiatValue = await unsignedGet('klines', {
            interval: '1m',
            startTime: t.time,
            endTime: t.time + 60000,
            symbol: buyCurrencyWithFiat,
          }).then((data) => data[0][4]);
          return {
            ...t,
            pair: c,
            fiatValue,
          };
        })
      );
    })
  );

const getCurrentFiatValue = async (symbol) => {
  const pair = `${symbol}EUR`;
  const time = Date.now();
  const fiatValue = await unsignedGet('klines', {
    interval: '1m',
    startTime: time - 60000,
    endTime: time,
    symbol: pair,
  }).then((data) => {
    return data[0][4];
  });
  return fiatValue;
};

module.exports = {
  getPairsTransactions,
  getTransactionsFiatValue,
  getCurrentFiatValue,
};

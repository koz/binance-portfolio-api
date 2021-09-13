const express = require('express');
const { signedGet, unsignedGet } = require('./api');

const app = express();

app.get('/transactions', async function (req, res) {
  const pairs = req.query.pairs;
  if (!pairs) {
    res.status = 400;
    res.statusMessage = 'Bad Request - Missing pairs';
    res.end();
    return;
  }
  const pairList = pairs.split(',');

  const assetTransactions = await Promise.all(
    pairList.map((c) => {
      const parsedPair = c.replace('/', '');
      return signedGet('myTrades', {
        symbol: parsedPair,
      });
    })
  );

  const transactionsWithFiatValue = await Promise.all(
    pairList.map(async (c, i) => {
      const parsedPair = c.split('/');
      const buyCurrency = parsedPair[1];
      // TODO: Filter buy currency when it's FIAT (EUR) so far.
      const buyCurrencyWithFiat = `${buyCurrency}EUR`;
      const transactions = assetTransactions[i];
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
            fiatValue,
          };
        })
      );
    })
  );

  res.status(200).json(transactionsWithFiatValue);
  res.end();
});

app.listen(3000, () => {
  console.log('Starting server');
});

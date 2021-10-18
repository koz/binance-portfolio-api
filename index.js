const express = require('express');
const { getPairsTransactions, getTransactionsFiatValue, getCurrentFiatValue } = require('./api');

const app = express();

app.get('/transactions', async function (req, res) {
  const pairs = req.query.pairs;
  if (!pairs) {
    res.status = 400;
    res.statusMessage = 'Bad Request - Missing pairs';
    res.end();
    return;
  }
  const pairsList = pairs.split(',');

  const assetTransactions = await getPairsTransactions(pairsList);

  const transactionsWithFiatValue = await getTransactionsFiatValue(assetTransactions);

  res.status(200).json(transactionsWithFiatValue);
  res.end();
});

app.get('/wallet', async function (req, res) {
  const pairs = req.query.pairs;
  if (!pairs) {
    res.status = 400;
    res.statusMessage = 'Bad Request - Missing pairs';
    res.end();
    return;
  }

  const pairsList = pairs.split(',');

  const assetTransactions = await getPairsTransactions(pairsList);

  const transactionsWithFiatValue = await getTransactionsFiatValue(assetTransactions);

  const wallet = await transactionsWithFiatValue.reduce(async (accum, transactions) => {
    await Promise.all(
      transactions.map(async (t) => {
        const parsedPair = t.pair.split('/');
        const boughtCurrency = parsedPair[0];
        const transactionQty = t.qty * (t.isBuyer ? 1 : -1);
        const transactionFiatValue = t.fiatValue * (t.isBuyer ? 1 : -1);
        if (!accum[boughtCurrency]) {
          accum[boughtCurrency] = {
            qty: transactionQty,
            fiatValue: transactionFiatValue,
            currentFiatValue: await getCurrentFiatValue(boughtCurrency),
          };
          return;
        }

        accum[boughtCurrency].qty += transactionQty;
        accum[boughtCurrency].fiatValue += transactionFiatValue;
        return;
      })
    );

    return accum;
  }, {});

  res.status(200).json(wallet);
  res.end();
});

app.listen(3000, () => {
  console.log('Starting server');
});

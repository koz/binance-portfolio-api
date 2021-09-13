const crypto = require('crypto');

const apiSecret = process.env.BINANCE_API_SECRET;

function signature(qs) {
  return crypto.createHmac('sha256', apiSecret).update(qs).digest('hex');
}

module.exports = {
  signature,
};

import crypto, { BinaryLike } from 'crypto';

export function signature(qs: string, apiSecret: BinaryLike): string {
  if (!apiSecret) {
    return ''
  }
  return crypto.createHmac('sha256', apiSecret).update(qs).digest('hex');
}

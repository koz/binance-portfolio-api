import crypto, { KeyLike } from 'crypto';

const privateKey: KeyLike | undefined = process.env.RSA_PRIVATE_KEY;

export const decryptMessage = (encryptedMessage: string) => {
  if (!privateKey) {
    return;
  }

  const rsaPrivateKey = {
    key: privateKey,
    passphrase: '',
    padding: crypto.constants.RSA_PKCS1_PADDING,
  };

  const decryptedMessage = crypto.privateDecrypt(rsaPrivateKey, Buffer.from(encryptedMessage, 'base64'));

  return decryptedMessage.toString('utf8');
};

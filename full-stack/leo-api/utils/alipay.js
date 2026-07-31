const { AlipaySdk } = require("alipay-sdk");

const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APPID,
  privateKey: process.env.ALIPAY_APP_PRIVATE_KEY,
  alipayPublicCertPath: process.env.ALIPAY_PUBLIC_KEY,
  ...(process.env.ALIPAY_ROOT_CERT_PATH
    ? { alipayRootCertPath: process.env.ALIPAY_ROOT_CERT_PATH }
    : {}),
});

module.exports = alipaySdk;

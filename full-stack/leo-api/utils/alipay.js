const { AlipaySdk } = require("alipay-sdk");

const alipaySdk = new AlipaySdk({
  appId: "2016123456789012",
  // 传入支付宝根证书、支付宝公钥证书和应用公钥证书。
  privateKey: process.env.ALIPAY_APPID,
  alipayRootCertPath: process.env.ALIPAY_APP_PRIVATE_KEY,
  alipayPublicCertPath: process.env.ALIPAY_PUBLIC_KEY,
  //   appCertPath: "/path/to/appCertPublicKey.crt",
});

module.exports = alipaySdk;

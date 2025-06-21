const { Configuration } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
/*
 * @type {Configuration}
 */
module.exports = {
  // webpack 配置
};

const config = {
  mode: "none",
  entry: "./index.js",
  output: {
    filename: "bundle.js",
  },
  devServer: {
    port: 9002,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
      filename: "index.html",
    }),
    new ModuleFederationPlugin({
      name: "host",
      remotes: {
        remote: "remote@http://localhost:9001/remoteEntry.js",
      },
    }),
  ],
};
module.exports = config;

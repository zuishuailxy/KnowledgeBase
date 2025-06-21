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
    port: 9001,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
      filename: "index.html",
    }),
    new ModuleFederationPlugin({
      name: "remote",
      filename: "remoteEntry.js",
      exposes: {
        "./addList": "./list.js",
      },
    }),
  ],
};
module.exports = config;

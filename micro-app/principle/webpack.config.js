const { Configuration } = require("webpack");
const path = require("path");

/**
 * @type {Configuration} //配置智能提示
 */
const config = {
  mode: "none",
  entry: "./src/index.ts",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "lib "),
    library: "wujievue",
    libraryTarget: "umd",
    umdNamedDefine: true,
  },
  externals: {
    vue: "vue",
    wujie: "wujie",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "swc-loader",
        exclude: /node_modules/,
      },
    ],
  },
};

module.exports = config;

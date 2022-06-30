// Top level Webpack configuration used for transpiling individual modules
// before publishing
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const babelOptions = require('./webpack/babel-options');

const config = {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: babelOptions,
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[local]---[hash:base64:5]',
              },
              sourceMap: true,
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, 'postcss.config.js'),
              },
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(jpg|jpeg|gif|png|ico)$/,
        type: 'asset/resource',
        generator: {
          filename: './img/[name].[contenthash].[ext]',
        },
      },
    ]
  }
};

config.optimization = {
  mangleWasmImports: true,
  minimizer: [
   '...', // in webpack@5 we can use the '...' syntax to extend existing minimizers
    new CssMinimizerPlugin(),
  ],
  minimize: true,
};

config.plugins = [
  new MiniCssExtractPlugin({ filename: 'style.css', ignoreOrder: false }),
  new webpack.optimize.LimitChunkCountPlugin({
    maxChunks: 1,
  }),
];

module.exports = config;

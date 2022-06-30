// Top level Webpack configuration for building static files for
// production deployment from the command line

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const { getSharedStyles } = require('./webpack/module-paths');

const base = require('./webpack.config.base');
const cli = require('./webpack.config.cli');

const prodConfig = Object.assign({}, base, cli, {
  mode: 'production',
  infrastructureLogging: {
    appendOnly: true,
    level: 'warn',
  }
});

prodConfig.plugins = prodConfig.plugins.concat([
  new MiniCssExtractPlugin({ filename: 'style.[contenthash].css' }),
  new webpack.ProvidePlugin({
    process: 'process/browser.js',
  }),
]);

prodConfig.resolve.alias = {
  ...prodConfig.resolve.alias,
  "stcom-interactionStyles": getSharedStyles("lib/sharedStyles/interactionStyles"),
  "stcom-variables": getSharedStyles("lib/variables"),
};

prodConfig.optimization = {
  mangleWasmImports: true,
  minimizer: [
   '...', // in webpack@5 we can use the '...' syntax to extend existing minimizers
    new CssMinimizerPlugin(),
  ],
  minimize: true,
}

prodConfig.module.rules.push({
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
});

prodConfig.module.rules.push(
  {
    test: /\.svg$/,
    use: [
      {
        loader: 'file-loader?name=img/[path][name].[contenthash].[ext]',
        options: {
          esModule: false,
        },
      },
      {
        loader: 'svgo-loader',
        options: {
          plugins: [
            { removeTitle: true },
            { convertColors: { shorthex: false } },
            { convertPathData: false }
          ]
        }
      }
    ]
  },
);

module.exports = prodConfig;

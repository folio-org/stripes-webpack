// Top level default Webpack configuration used for transpiling individual modules
// before publishing
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const babelOptions = require('./webpack/babel-options');

const processExternals = (externals) => {
  return externals.reduce((acc, name) => {
    acc[name] = {
      root: name,
      commonjs2: name,
      commonjs: name,
      amd: name,
      umd: name
    };

    return acc;
  }, {});
};

const config = {
  mode: 'production',
  entry: path.resolve('./index.js'),
  output: {
    library: {
      type: 'umd',
    },
    path: path.resolve('./dist'),
    filename: 'index.js',
    umdNamedDefine: true,
  },
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
    ]
  },
  // Set default externals. These can be extended by individual modules.
  externals: processExternals([
    'react',
    'react-dom',
    'react-intl',
    'react-router',
    'moment',
    'moment-timezone',
    'stripes-config',
    '@folio/stripes',
    '@folio/stripes-connect',
    '@folio/stripes-core',
    '@folio/stripes-components',
    '@folio/stripes-util',
    '@folio/stripes-form',
    '@folio/stripes-final-form',
    '@folio/stripes-logger',
    '@folio/stripes-smart-components',
  ])
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

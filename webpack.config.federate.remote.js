const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { container } = webpack;
const { processExternals, processShared } = require('./webpack/utils');
const { getStripesModulesPaths } = require('./webpack/module-paths');
const esbuildLoaderRule = require('./webpack/esbuild-loader-rule');
const { singletons } = require('./consts');

const buildConfig = (metadata) => {
  const { host, port, name, displayName } = metadata;
  const mainEntry = path.join(process.cwd(), 'src', 'index.js');
  const stripesModulePaths = getStripesModulesPaths();
  const translationsPath = path.join(process.cwd(), 'translations', displayName.split('.').shift());
  const shared = processShared(singletons, { singleton: true });

  const config = {
    name,
    devtool: 'inline-source-map',
    mode: 'development',
    entry: mainEntry,
    output: {
      publicPath: `${host}:${port}/`,
    },
    devServer: {
      port: port,
      open: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      static: {
        directory: translationsPath,
        publicPath: '/translations'
      }
    },
    module: {
      rules: [
        esbuildLoaderRule(stripesModulePaths),
        {
          test: /\.(woff2?)$/,
          type: 'asset/resource',
          generator: {
            filename: './fonts/[name].[contenthash].[ext]',
          },
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
          use: [{
            loader: 'url-loader',
            options: {
              esModule: false,
            },
          }]
        },
        {
          test: /\.js.map$/,
          enforce: "pre",
          use: ['source-map-loader'],
        }
      ]
    },
    // TODO: remove this after stripes-config is gone.
    externals: processExternals({ 'stripes-config': true }),
    plugins: [
      new MiniCssExtractPlugin({ filename: 'style.css', ignoreOrder: false }),
      new container.ModuleFederationPlugin({
        library: { type: 'var', name },
        name,
        filename: 'remoteEntry.js',
        exposes: {
          './MainEntry': mainEntry,
        },
        shared
      }),
    ]
  };

  return config;
}

module.exports = buildConfig;

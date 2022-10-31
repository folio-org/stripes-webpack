// Top level Webpack configuration for running a development environment
// from the command line via devServer.js

const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const { tryResolve } = require('./webpack/module-paths');
const babelLoaderRule = require('./webpack/babel-loader-rule');
const utils = require('./webpack/utils');
const base = require('./webpack.config.base');
const cli = require('./webpack.config.cli');

const useBrowserMocha = () => {
  return tryResolve('mocha/mocha-es2018.js') ? 'mocha/mocha-es2018.js' : 'mocha';
};

const buildConfig = (stripesConfig) => {
  const devConfig = Object.assign({}, base, cli, {
    devtool: 'inline-source-map',
    mode: 'development',
    // cache: false,
    cache: {
      type: 'filesystem',
      name: 'FOLIOCache',
    },
    target: 'web',
    infrastructureLogging: {
      appendOnly: true,
      level: 'warn',
    },
  });
    
  const useBrowserMocha = () => {
    return tryResolve('mocha/mocha-es2018.js') ? 'mocha/mocha-es2018.js' : 'mocha';
  };

  // Override filename to remove the hash in development due to memory issues (STCOR-296)
  devConfig.output.filename = 'bundle.js';
  devConfig.entry = [
    'webpack-hot-middleware/client',
    ...devConfig.entry.css,
    '@folio/stripes-web',
  ];

  devConfig.plugins = devConfig.plugins.concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
    }),
  ]);

  // include HMR plugins only when in development
  if (utils.isDevelopment) {
    devConfig.plugins = devConfig.plugins.concat([
      new webpack.HotModuleReplacementPlugin(),
      new ReactRefreshWebpackPlugin()
    ]);
  }

  // This alias avoids a console warning for react-dom patch
  devConfig.resolve.alias.process = 'process/browser.js';
  devConfig.resolve.alias['mocha'] = useBrowserMocha();

  devConfig.module.rules.push(babelLoaderRule(stripesConfig));

  // add 'Buffer' global required for tests/reporting tools.
  devConfig.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  );

  // add resolutions for node utilities required for test suites.
  devConfig.resolve.fallback = {
    "crypto": require.resolve('crypto-browserify'),
    "stream": require.resolve('stream-browserify'),
    "util": require.resolve('util-ex'),
  };

  devConfig.module.rules.push(
    {
      test: /\.svg$/,
      use: [{
        loader: 'url-loader',
        options: {
          esModule: false,
        },
      }]
    },
  );

  return devConfig;
}

module.exports = buildConfig;

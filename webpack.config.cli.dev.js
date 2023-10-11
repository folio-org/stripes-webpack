// Top level Webpack configuration for running a development environment
// from the command line via devServer.js
const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const { getModulesPaths, getStripesModulesPaths } = require('./webpack/module-paths');
const { tryResolve } = require('./webpack/module-paths');
const esbuildLoaderRule = require('./webpack/esbuild-loader-rule');
const utils = require('./webpack/utils');
const buildBaseConfig = require('./webpack.config.base');
const cli = require('./webpack.config.cli');


const useBrowserMocha = () => {
  return tryResolve('mocha/mocha-es2018.js') ? 'mocha/mocha-es2018.js' : 'mocha';
};

const buildConfig = (stripesConfig) => {
  const modulePaths = getModulesPaths(stripesConfig.modules);
  const stripesModulePaths = getStripesModulesPaths();
  const allModulePaths = [...stripesModulePaths, ...modulePaths];

  const base = buildBaseConfig(allModulePaths);
  const devConfig = Object.assign({}, base, cli, {
    name: 'development',
    devtool: 'inline-source-map',
    mode: 'development',
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

  // Override filename to remove the hash in development due to memory issues (STCOR-296)
  devConfig.output.filename = 'bundle.js';
  devConfig.entry = [
    'webpack-hot-middleware/client',
    ...devConfig.entry.css,
    '@folio/stripes-ui',
  ];

  // in dev-mode when react-refresh-webpack-plugin (hot reload) is in play
  // and there are multiple entry points on a single page (as there are now
  // that we have a service-worker), we need to make sure there is only one
  // runtime instance so that modules are only instantiated once.
  //
  // I don't entirely understand what that ^^^^ means, but it's the outcome
  // of a conversation among the creators of react, pmmmwh, and webpack,
  // so I ain't gonna argue.
  //
  // thanks SO: https://stackoverflow.com/questions/65640449/how-to-solve-chunkloaderror-loading-hot-update-chunk-second-app-failed-in-webpa
  // and sokra: https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/88#issuecomment-627558799
  // devConfig.optimization = {
  //   runtimeChunk: 'single'
  // };

  devConfig.plugins = devConfig.plugins.concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      // add 'Buffer' global required for tests/reporting tools.
      Buffer: ['buffer', 'Buffer']
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

  devConfig.module.rules.push(esbuildLoaderRule(allModulePaths));


  // add resolutions for node utilities required for test suites.
  devConfig.resolve.fallback = {
    "crypto": require.resolve('crypto-browserify'),
    "stream": require.resolve('stream-browserify'),
    "util": require.resolve('util-ex'),
  };

  return devConfig;
}

module.exports = buildConfig;

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
const { singletons } = require('./consts');
const { ModuleFederationPlugin } = require('webpack').container;
const { processShared } = require('./webpack/utils');

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
      new ReactRefreshWebpackPlugin(),
    ]);
  }

  // Enable module federation, setting up the host platform to share singletons (react, stripes-core, etc) with remote modules.
  if (stripesConfig.okapi.entitlementUrl) {
    const shared = processShared(singletons, { singleton: true, eager: true });
    devConfig.plugins.push(new ModuleFederationPlugin({ name: 'host', shared }));
  }

  // This alias avoids a console warning for react-dom patch
  devConfig.resolve.alias.process = 'process/browser.js';
  devConfig.resolve.alias['mocha'] = useBrowserMocha();

  devConfig.module.rules.push(esbuildLoaderRule(allModulePaths));


  // add resolutions for node utilities required for test suites.
  devConfig.resolve.fallback = {
    "crypto": false,
    "stream": require.resolve('stream-browserify'),
    "util": require.resolve('util-ex'),
  };

  return devConfig;
}

module.exports = buildConfig;

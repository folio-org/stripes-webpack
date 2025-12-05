// Top level Webpack configuration for building static files for
// production deployment from the command line

const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { EsbuildPlugin } = require('esbuild-loader');
const buildBaseConfig = require('./webpack.config.base');

const cli = require('./webpack.config.cli');
const esbuildLoaderRule = require('./webpack/esbuild-loader-rule');
const { getModulesPaths, getStripesModulesPaths, getTranspiledModules } = require('./webpack/module-paths');
const { processShared } = require('./webpack/utils');
const { ModuleFederationPlugin } = require('webpack').container;
const { singletons } = require('./consts');


const buildConfig = (stripesConfig, options = {}) => {
  const modulePaths = getModulesPaths(stripesConfig.modules);
  const stripesModulePaths = getStripesModulesPaths();
  const allModulePaths = [...stripesModulePaths, ...modulePaths];
  const base = buildBaseConfig(allModulePaths);
  const prodConfig = Object.assign({}, base, cli, {
    mode: 'production',
    devtool: 'source-map',
    infrastructureLogging: {
      appendOnly: true,
      level: 'warn',
    },
  });

  const splitChunks = {
    // Do not process stripes chunk
    chunks: (chunk) => {
      return chunk.name !== 'stripes';
    },
    cacheGroups: {
      // this cache group will be omitted by minimizer
      stripes: {
        // only include already transpiled modules
        test: (module) => transpiledModulesRegex.test(module.resource),
        name: 'stripes',
        chunks: 'all'
      },
    },
  };

  if (options.lazy) {
    splitChunks.chunks = 'all';
    splitChunks.cacheGroups = undefined;
  }

  const transpiledModules = getTranspiledModules(allModulePaths);
  const transpiledModulesRegex = new RegExp(transpiledModules.join('|'));

  prodConfig.plugins = prodConfig.plugins.concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
    }),
  ]);

  // build platform with Module Federation if entitlementUrl is provided
  if (stripesConfig.okapi.entitlementUrl) {
    const shared = processShared(singletons, { singleton: true, eager: true });
    prodConfig.plugins.push(
      new ModuleFederationPlugin({ name: 'host', shared })
    );
  }

  prodConfig.optimization = {
    mangleWasmImports: false,
    minimizer: [
      new EsbuildPlugin({
        css: true,
      }),
    ],
    splitChunks,
  }

  prodConfig.module.rules.push(esbuildLoaderRule(allModulePaths));

  prodConfig.plugins.push(
    new MiniCssExtractPlugin({ filename: 'style.[contenthash].css', ignoreOrder: true })
  );

  return prodConfig;
};

module.exports = buildConfig;

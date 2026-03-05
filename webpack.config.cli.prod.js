// Top level Webpack configuration for building static files for
// production deployment from the command line

const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { EsbuildPlugin } = require('esbuild-loader');
const buildBaseConfig = require('./webpack.config.base');

const cli = require('./webpack.config.cli');
const esbuildLoaderRule = require('./webpack/esbuild-loader-rule');
const { getModulesPaths, getStripesModulesPaths, getTranspiledModules } = require('./webpack/module-paths');
const { addHostMFConfig } = require('./module-federation-config');

const buildConfig = (stripesConfig, options = {}) => {
  const modulePaths = getModulesPaths(stripesConfig.modules);
  const stripesModulePaths = getStripesModulesPaths();
  const allModulePaths = [...stripesModulePaths, ...modulePaths];
  const base = buildBaseConfig(allModulePaths);
  const prodOverrides = {
    mode: 'production',
    devtool: 'source-map',
    infrastructureLogging: {
      appendOnly: true,
      level: 'warn',
    },
  };
  let prodConfig = { ...base, ...cli, ...prodOverrides };

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

  // build platform with Module Federation if --federate flag is passed
  if (options.federate) {
    prodConfig = addHostMFConfig(prodConfig);
    prodConfig.optimization = {
      concatenateModules: false,
    };
  } else {
    prodConfig.optimization = {
      mangleWasmImports: false,
      minimizer: [
        new EsbuildPlugin({
          css: true,
        }),
      ],
      splitChunks,
    }
  }


  prodConfig.module.rules.push(esbuildLoaderRule(allModulePaths));

  prodConfig.plugins.push(
    new MiniCssExtractPlugin({ filename: 'style.[contenthash].css', ignoreOrder: true })
  );

  return prodConfig;
};

module.exports = buildConfig;

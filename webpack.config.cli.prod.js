// Top level Webpack configuration for building static files for
// production deployment from the command line

import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { EsbuildPlugin } from 'esbuild-loader';
import buildBaseConfig from './webpack.config.base.js';

import cli from './webpack.config.cli.js';
import esbuildLoaderRule from './webpack/esbuild-loader-rule.js';
import { getModulesPaths, getStripesModulesPaths, getTranspiledModules } from './webpack/module-paths.js';
import { addHostMFConfig } from './module-federation-config.js';

const buildConfig = (stripesConfig, options = {}) => {
  const modulePaths = getModulesPaths(stripesConfig.modules);
  const stripesModulePaths = getStripesModulesPaths();
  const allModulePaths = [...stripesModulePaths, ...modulePaths];
  const base = buildBaseConfig(allModulePaths, stripesConfig);
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

  prodConfig.optimization = {
    mangleWasmImports: false,
    minimizer: [
      new EsbuildPlugin({
        css: true,
        minify: Boolean(options.minify)
      }),
    ],
    splitChunks,
  }

  // build platform with Module Federation if --federate flag is passed
  if (options.federate) {
    prodConfig.optimization = {
      concatenateModules: false,
      ...prodConfig.optimization,
    };
    prodConfig = addHostMFConfig(prodConfig);
  }

  prodConfig.module.rules.push(esbuildLoaderRule(allModulePaths));

  prodConfig.plugins.push(
    new MiniCssExtractPlugin({ filename: 'style.[contenthash].css', ignoreOrder: true })
  );

  return prodConfig;
};

export default buildConfig;

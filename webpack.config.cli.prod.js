// Top level Webpack configuration for building static files for
// production deployment from the command line

const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const { getSharedStyles } = require('./webpack/module-paths');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const base = require('./webpack.config.base');
const cli = require('./webpack.config.cli');
const babelLoaderRule = require('./webpack/babel-loader-rule');
const { getModulesPaths, getStripesModulesPaths, getTranspiledModules } = require('./webpack/module-paths');

const buildConfig = (stripesConfig) => {
  const prodConfig = Object.assign({}, base, cli, {
    mode: 'production',
    devtool: 'source-map',
    infrastructureLogging: {
      appendOnly: true,
      level: 'warn',
    },
    externalsPresets: {
      node: true // in order to ignore built-in modules like path, fs, etc.
  },
  });

  const modulePaths = getModulesPaths(stripesConfig.modules);
  const stripesModulePaths = getStripesModulesPaths();
  const transpiledModules = getTranspiledModules([...stripesModulePaths, ...modulePaths]);
  const transpiledModulesRegex = new RegExp(transpiledModules.join('|'));
  const smp = new SpeedMeasurePlugin();

  prodConfig.plugins = prodConfig.plugins.concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
    }),
  ]);

  prodConfig.resolve.alias = {
    ...prodConfig.resolve.alias,
    'stcom-interactionStyles': getSharedStyles('lib/sharedStyles/interactionStyles'),
    'stcom-variables': getSharedStyles('lib/variables'),
  };

  prodConfig.optimization = {
    mangleWasmImports: false,
    minimizer: [
      new TerserPlugin({
        // exclude stripes cache group from the minimizer
        exclude: /stripes/,
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
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
    },
    minimize: true,
  }

  prodConfig.module.rules.push(babelLoaderRule(stripesConfig));

  const webpackConfig = smp.wrap({ plugins: prodConfig.plugins });
  webpackConfig.plugins.push(
    new MiniCssExtractPlugin({ filename: 'style.[contenthash].css' })
  );


  return { ...prodConfig, ...webpackConfig };
};

module.exports = buildConfig;

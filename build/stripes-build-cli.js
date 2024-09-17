#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const build = require('../webpack/build');
const nodeApi = require('../webpack/stripes-node-api');
const StripesPlatform = require('./stripes-platform');

nodeApi.StripesModuleParser = require('../webpack/stripes-module-parser').StripesModuleParser;
nodeApi.StripesBuildError = require('../webpack/stripes-build-error');

function processStats(stats) {
  console.log(stats.toString({
    chunks: false,
    colors: true,
  }));
  // Check for webpack compile errors and exit
  if (stats.hasErrors()) {
    processError();
  }
}

process.title = 'stripes-cli';
process.env.NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : 'production';

const stripesConfig = require(path.join(process.env.PWD, process.argv[3]));
const output = process.argv.length === 5 ? process.argv[4] : null;

const argv = {
  stripesConfig,
  output,
};
const context = {};

const platform = new StripesPlatform(argv.stripesConfig, context, argv);
const webpackOverrides = platform.getWebpackOverrides(context);

if (argv.output) {
  argv.outputPath = argv.output;
} else if (!argv.outputPath) {
  argv.outputPath = './output';
}
if (argv.maxChunks) {
  webpackOverrides.push(limitChunks(argv.maxChunks));
}
if (argv.cache === false) {
  webpackOverrides.push(ignoreCache);
}
if (context.plugin && context.plugin.beforeBuild) {
  webpackOverrides.push(context.plugin.beforeBuild(argv));
}

console.log('Building...');
nodeApi.build(platform.getStripesConfig(), Object.assign({}, argv, { webpackOverrides }))
  .then(processStats)
  .catch(e => {
    console.error('ERROR', e);
  });

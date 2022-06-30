const path = require('path');
const webpack = require('webpack');
const logger = require('./logger')();
const { tryResolve } = require('./module-paths');

module.exports = function transpile(options = {}) {
  return new Promise((resolve, reject) => {
    logger.log('starting build...');
    let config = require('../webpack.config.cli.transpile');
    // TODO: allow for name customization
    const moduleTranspileConfigPath = path.join(process.cwd(), 'webpack.transpile.config.js');

    if (tryResolve(moduleTranspileConfigPath)) {
      const moduleTranspileConfig = require(moduleTranspileConfigPath);
      config = { ...config, ...moduleTranspileConfig }
    }

    const compiler = webpack(config);
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
};

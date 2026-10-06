import { createRequire } from 'node:module';
import path from 'path';
import webpack from 'webpack';
import transpileConfig from '../webpack.config.cli.transpile.js';
import applyWebpackOverrides from './apply-webpack-overrides.js';
import getLogger from './logger.js';
const logger = getLogger();
import { tryResolve } from './module-paths.js';
import { processExternals } from './utils.js';

const require = createRequire(import.meta.url);

export default function transpile(options = {}) {
  return new Promise((resolve, reject) => {
    logger.log('starting build...');
    let config = transpileConfig;

    // TODO: allow for name customization
    const moduleTranspileConfigPath = path.join(process.cwd(), 'webpack.transpile.config.js');
    const packagePath = path.join(process.cwd(), 'package.json');

    if (tryResolve(packagePath)) {
      const packageJson = require(packagePath);
      const { name, peerDependencies } = packageJson;

      config.output.library = {
        type: 'umd',
        name,
      };

      if (peerDependencies) {
        config.externals = processExternals(peerDependencies);
      }
    }

    if (tryResolve(moduleTranspileConfigPath)) {
      const moduleTranspileConfig = require(moduleTranspileConfigPath);
      moduleTranspileConfig.externals = { ...config.externals, ...moduleTranspileConfig.externals };
      config = { ...config, ...moduleTranspileConfig };
    }

    // Give the caller a chance to apply their own webpack overrides
    config = applyWebpackOverrides(options.webpackOverrides, config);

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

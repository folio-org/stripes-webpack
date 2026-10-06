import { createRequire } from 'node:module';
import webpack from 'webpack';
import path from 'path';
import StripesWebpackPlugin from './stripes-webpack-plugin.js';
import AddAssetHtmlPlugin from 'add-asset-html-webpack-plugin';
import applyWebpackOverrides from './apply-webpack-overrides.js';
import getLogger from './logger.js';
const logger = getLogger();
import buildConfig from '../webpack.config.cli.prod.js';
import federate from './federate.js';
import sharedStylesConfig from '../webpack.config.cli.shared.styles.js';

const require = createRequire(import.meta.url);
const platformModulePath = path.join(path.resolve(), 'node_modules');

export default function build(stripesConfig, options) {
  return new Promise((resolve, reject) => {
    logger.log('starting build...');

    const buildCallback = (err, stats) => {
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        reject(err);
      } else {
        resolve(stats);
      }
    };

    if (options.federate) {
      const contextMessage = options.context.isUiModule ? 'federated remote ui-module' : 'host app for federated platform';
      console.log(`Building ${contextMessage}.`);
      if (options.context.isUiModule) {
        // the federate function handles federation-specific bundling for ui-modules apart from
        // the host app, including module-level translations and handling of shared dependencies.
        return federate(
          stripesConfig,
          { ...options, build: true, mode: 'production' },
          buildCallback);
      }
    }

    let config;
    config = buildConfig(stripesConfig, options);

    config = sharedStylesConfig(config, {});

    if (!options.skipStripesBuild) {
      config.plugins.push(new StripesWebpackPlugin({ stripesConfig, createDll: options.createDll, lazy: options.lazy }));
    }

    config.resolve.modules = ['node_modules', platformModulePath];
    config.resolveLoader = { modules: ['node_modules', platformModulePath] };

    if (options.outputPath) {
      config.output.path = path.resolve(options.outputPath);
    }
    if (options.publicPath) {
      config.output.publicPath = options.publicPath;
    }
    if (options.sourcemap) {
      config.devtool = 'source-map';
    }
    if (options.createDll && options.dllName) { // Adjust build to create Webpack DLL
      config.entry = {};
      config.entry[options.dllName] = options.createDll.split(',');
      config.output.library = '[name]';
      config.output.filename = '[name].[fullhash].js';
      config.plugins.push(new webpack.DllPlugin({
        name: '[name]',
        path: path.join(options.outputPath, '[name].json'),
      }));
    }
    if (options.useDll) { // Consume Webpack DLL
      const dependencies = options.useDll.split(',');
      const dllPaths = [];

      for (const dependency of dependencies) {
        const dependencyPath = path.resolve(dependency);
        config.plugins.push(new webpack.DllReferencePlugin({
          context: path.resolve(),
          manifest: require(dependencyPath)
        }));

        const dllPath = path.dirname(dependencyPath);

        dllPaths.push({ glob: `${dllPath}/*.js` });
      }

      config.plugins.push(new AddAssetHtmlPlugin(dllPaths));
    }

    // By default, Webpack's production mode will configure UglifyJS
    // Override this when we explicity set --no-minify on the command line
    if (options.minify === false) {
      config.optimization = config.optimization || {};
      config.optimization.minimize = false;
    }

    // Give the caller a chance to apply their own webpack overrides
    config = applyWebpackOverrides(options.webpackOverrides, config);

    logger.log('assign final webpack config', config);

    webpack(config, buildCallback);
  });
};

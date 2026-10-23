import webpack from 'webpack';
import path from 'path';
import express from 'express';
import cors from 'cors';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import connectHistoryApiFallback from 'connect-history-api-fallback';
import StripesWebpackPlugin from './stripes-webpack-plugin.js';
import applyWebpackOverrides from './apply-webpack-overrides.js';
import getLogger from './logger.js';
const logger = getLogger();
import buildConfig from '../webpack.config.cli.dev.js';
import sharedStylesConfig from '../webpack.config.cli.shared.styles.js';
import registryServer from './registryServer.js';
import federate from './federate.js';
import { defaultDiscoveryUrl } from '../consts.js';

const cwd = path.resolve();
const platformModulePath = path.join(cwd, 'node_modules');
const coreModulePath = path.join(import.meta.dirname, '..', 'node_modules');
const serverRoot = path.join(import.meta.dirname, '..');

export default function serve(stripesConfig, options) {
  // serving a locally federated module
  if (options.federate && options.context.isUiModule) {
    // override default port 3000 option, as locally federated modules will be on >= 3002...
    options.port = options.port !== 3000 ? options.port : undefined;
    return federate(stripesConfig, options);
  }

  if (typeof stripesConfig.okapi !== 'object') throw new Error('Missing Okapi config');
  if (typeof stripesConfig.okapi.url !== 'string') throw new Error('Missing Okapi URL');
  if (stripesConfig.okapi.url.endsWith('/')) throw new Error('Trailing slash in Okapi URL will prevent Stripes from functioning');

  return new Promise((resolve) => {
    logger.log('starting serve...');
    const app = express();

    app.disable("x-powered-by");

    app.use(express.json());

    app.use(cors());

    // stripes module registry
    if (options.federate) {
      const { discoveryUrl: configDiscoveryUrl, tenant } = stripesConfig.okapi;
      let discoveryUrl = configDiscoveryUrl || defaultDiscoveryUrl;
      // since we purposefully used the --federate flag, if there isn't a discoveryUrl specified in our stripes-config, inject
      // the default discoveryUrl.
      if (!configDiscoveryUrl) {
        stripesConfig.okapi.discoveryUrl = defaultDiscoveryUrl;
      }

      // If the discoveryUrl points to 'localhost', start a local registry for development/debug.
      // For production, discoveryUrl will point to some non-local endpoint and the UI will fetch accordingly.
      if (discoveryUrl.includes('localhost')) {
        try {
          registryServer.start(discoveryUrl, tenant);
        }
        catch (e) {
          console.error(e)
        }
      }
    }

    let config = buildConfig(stripesConfig);

    config = sharedStylesConfig(config, {});

    config.plugins.push(new StripesWebpackPlugin({ stripesConfig }));

    // Look for modules in node_modules, then the platform, then stripes-core
    config.resolve.modules = ['node_modules', platformModulePath, coreModulePath];
    config.resolveLoader = { modules: ['node_modules', platformModulePath, coreModulePath] };

    if (options.devtool) {
      config.devtool = options.devtool;
    }
    // Give the caller a chance to apply their own webpack overrides
    config = applyWebpackOverrides(options.webpackOverrides, config);

    logger.log('assign final webpack config', config);
    const compiler = webpack(config);

    compiler.hooks.done.tap('StripesCoreServe', stats => resolve(stats));

    const port = options.port || process.env.STRIPES_PORT || 3000;
    const host = options.host || process.env.STRIPES_HOST || 'localhost';

    const staticFileMiddleware = express.static(`${serverRoot}/public`);

    app.use(staticFileMiddleware);

    // To handle rewrites without the dot rule, we should include the static middleware twice
    // https://github.com/bripkens/connect-history-api-fallback/blob/master/examples/static-files-and-index-rewrite
    app.use(staticFileMiddleware);

    // Process index rewrite before webpack-dev-middleware
    // to respond with webpack's dist copy of index.html
    app.use(connectHistoryApiFallback({
      disableDotRule: true,
      htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
    }));

    app.use(webpackDevMiddleware(compiler, {
      publicPath: config.output.publicPath,
    }));

    app.use(webpackHotMiddleware(compiler));
    app.listen(port, host, (err) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log(`Listening at http://${host}:${port}`);
    });
  });
};

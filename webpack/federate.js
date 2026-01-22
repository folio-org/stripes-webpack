const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const { snakeCase } = require('lodash');
const portfinder = require('portfinder');

const buildConfig = require('../webpack.config.federate.remote');
const { tryResolve } = require('./module-paths');
const logger = require('./logger')();

// Remotes will be serve starting from port 3002
portfinder.setBasePort(3002);

module.exports = async function federate(stripesConfig, options = {}, callback = () => { }) {
  logger.log('starting federation...');
  const { entitlementUrl } = stripesConfig.okapi;
  const packageJsonPath = tryResolve(path.join(process.cwd(), 'package.json'));

  if (!packageJsonPath) {
    console.error('package.json not found');
    process.exit();
  }

  // publicPath for how remoteEntry will be accessed.
  let url;
  const port = options.port ?? await portfinder.getPortPromise();
  const host = options.host ?? `http://localhost`;
  if (options.publicPath) {
    url = `${options.publicPath}/remoteEntry.js`
  } else {
    url = `${host}:${port}/remoteEntry.js`;
  }

  const { name: packageName, version, description, stripes, main } = require(packageJsonPath);
  const { permissionSets: _, ...stripesRest } = stripes;
  const name = snakeCase(packageName);
  const metadata = {
    module: packageName,
    version,
    description,
    host,
    port,
    location: url,
    name,
    id: `${name}-${version}`,
    main,
    ...stripesRest,
  };

  const config = await buildConfig(metadata, options);

  if (options.build) { // build only
    webpack(config, callback);
    return;
  }

  const requestHeader = {
    "Content-Type": "application/json",
  };

  // update registry
  await fetch(
    entitlementUrl, {
    method: 'POST',
    headers: requestHeader,
    body: JSON.stringify(metadata),
  })
    .catch(error => {
      console.error(`Registry not found. Please check ${entitlementUrl}`);
      process.exit();
    });

  const compiler = webpack(config);
  const server = new WebpackDevServer(config.devServer, compiler);
  console.log(`Starting remote server on port ${port}`);


  compiler.hooks.shutdown.tapPromise('AsyncShutdownHook', async (stats) => {
    try {
      await fetch(entitlementUrl, {
        method: 'DELETE',
        headers: requestHeader,
        body: JSON.stringify(metadata),
      }).catch(error => {
        throw new Error(error);
      });
    } catch (error) {
      console.error(`registry not found. Please check ${entitlementUrl}`);
    }
  });

  // serve command expects a promise...
  return server.start();
};

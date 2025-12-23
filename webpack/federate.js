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

module.exports = async function federate(options = {}) {
  logger.log('starting federation...');

  const packageJsonPath = tryResolve(path.join(process.cwd(), 'package.json'));

  if (!packageJsonPath) {
    console.error('package.json not found');
    process.exit();
  }

  const port = options.port ?? await portfinder.getPortPromise();
  const host = `http://localhost`;
  const url = `${host}:${port}/remoteEntry.js`;

  const { name: packageName, version, description, stripes, main } = require(packageJsonPath);
  const { permissionSets: _, ...stripesRest } = stripes;
  const name = snakeCase(packageName);
  const metadata = {
    module: packageName,
    version,
    description,
    host,
    port,
    url,
    name,
    main,
    ...stripesRest,
  };

  const config = buildConfig(metadata);

  // TODO: allow for configuring entitlementUrl via env var or stripes config
  const entitlementUrl = 'http://localhost:3001/registry';

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
  // axios.post(entitlementUrl, metadata).catch(error => {
  //   console.error(`Registry not found. Please check ${entitlementUrl}`);
  //   process.exit();
  // });

  const compiler = webpack(config);
  const server = new WebpackDevServer(config.devServer, compiler);
  console.log(`Starting remote server on port ${port}`);
  server.start();

  compiler.hooks.shutdown.tapPromise('AsyncShutdownHook', async (stats) => {
    try {
      await fetch(entitlementUrl, {
        method: 'DELETE',
        headers: requestHeader,
        body: JSON.stringify(metadata),
      }).catch(error => {
        throw new Error(error);
      });
      // await axios.delete(entitlementUrl, { data: metadata });
    } catch (error) {
      console.error(`registry not found. Please check ${entitlementUrl}`);
    }
  });
};

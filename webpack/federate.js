const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const axios = require('axios');
const { snakeCase } = require('lodash');
const portfinder = require('portfinder');

const applyWebpackOverrides = require('./apply-webpack-overrides');
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

  const port = await portfinder.getPortPromise();
  const host = `http://localhost`;
  const url = `${host}:${port}/remoteEntry.js`;

  const { name: packageName, version, description, stripes } = require(packageJsonPath);
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
    ...stripesRest,
  };

  const config = buildConfig(metadata);

  // TODO: allow for configuring registryUrl via env var or stripes config
  const registryUrl = 'http://localhost:3001/registry';

  // update registry
  axios.post(registryUrl, metadata).catch(error => {
    console.error(`Registry not found. Please check ${registryUrl}`);
    process.exit();
  });

  const compiler = webpack(config);
  const server = new WebpackDevServer(config.devServer, compiler);
  console.log(`Starting remote server on port ${port}`);
  server.start();

  process.on('SIGINT', async () => {
    await axios.delete(registryUrl, { data: metadata });
    process.exit(0);
  });
};

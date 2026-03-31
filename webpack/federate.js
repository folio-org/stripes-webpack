const path = require('path');
const net = require('net');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const { snakeCase } = require('lodash');

const buildConfig = require('../webpack.config.federate.remote');
const { tryResolve } = require('./module-paths');
const logger = require('./logger')();

// Function to check if a port is free
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close();
      resolve(true);
    });
    server.on('error', () => {
      resolve(false);
    });
  });
}

// Function to find the next free port starting from a given port
async function findFreePort(startPort) {
  let port = startPort;
  while (!(await isPortFree(port))) {
    port++;
  }
  return port;
}

module.exports = async function federate(stripesConfig, options = {}, callback = () => { }) {
  logger.log('starting federation...');
  const { discoveryUrl } = stripesConfig.okapi;
  const packageJsonPath = tryResolve(path.join(process.cwd(), 'package.json'));

  if (!packageJsonPath) {
    console.error('package.json not found');
    process.exit();
  }

  // These variables are for spinning up and serving a federated remote module locally.
  // The values here are sent to the local discovery service to register the module
  // and the port is passed through to webpack-dev-server to host the module in dev mode.
  const port = options.port ?? await findFreePort(3002);
  const host = options.host ?? 'http://localhost';
  const url = `${host}:${port}/remoteEntry.js`;

  const { name: packageName, version, description, stripes, main } = require(packageJsonPath);
  const { permissionSets: _, ...stripesRest } = stripes;
  const name = snakeCase(packageName);
  const metadata = {
    module: packageName,
    version,
    description,
    port,
    location: url,
    name,
    id: `${name}-${version}`,
    main,
    ...stripesRest,
  };

  const config = buildConfig(metadata, options);

  if (options.build) { // build only
    webpack(config, callback);
    return;
  }

  const requestHeader = {
    "Content-Type": "application/json",
  };

  // update registry
  try {
    await fetch(
      discoveryUrl, {
      method: 'POST',
      headers: requestHeader,
      body: JSON.stringify(metadata),
    })
  } catch (err) {
    console.error(`Local discovery not found for module registration. Please check ${discoveryUrl}:${err}`);
    process.exit();
  }

  const compiler = webpack(config);
  const server = new WebpackDevServer(config.devServer, compiler);
  console.log(`Starting remote server on port ${port}`);


  compiler.hooks.shutdown.tapPromise('AsyncShutdownHook', async (stats) => {
    try {
      await fetch(discoveryUrl, {
        method: 'DELETE',
        headers: requestHeader,
        body: JSON.stringify(metadata),
      })
    } catch (err) {
      throw new Error(`Local discovery not found when removing module. Please check ${discoveryUrl} : ${err}`);
    };
  });

  // serve command expects a promise...
  return server.start();
};

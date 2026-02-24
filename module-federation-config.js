const path = require('path');
const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');
const { processShared } = require('./webpack/utils.js');
const { getHostAppSingletons } = require('./consts.js');

// Module federation resolves dependencies at runtime.
// 'shared' holds a key-value list of modules and versions that are common between
// the host app and the remote modules.
// When a remote ui-module is loaded, module federation runtime will check these
// dependencies and load the individual chunks accordingly.
// For dependencies that are configured as singletons, only a single version will be loaded from the host app.
// If a version is semver incompatible, a console warning will be emitted.

// At runtime, the host app will
// 1. load the remoteEntry.js script as directed by the module's location.
// 2. remote entry requires its own set of chunks, determining location of those chunks (publicPath: 'auto' logic).
// 3. The above are stored in a 'container' (webpack/mod-fed term) - a global variable by the 'name' field.
//    The host app 'imports' the app via container.get('MainEntry') from the loaded code.

function addHostMFConfig(config) {
  // Get our list of shared singleton dependencies. This comes from the peerDeps of the installed stripes-core package.
  // This list of 'package: version' is processed to fit the Module Federation config shape with our custom options
  // applied to each dependency.
  const shared = processShared(getHostAppSingletons(), {
    singleton: true, // only one copy loaded
    eager: true // include in the initial host bundle that loads before any remotes.
  });

  config.plugins.push(
    new ModuleFederationPlugin({
      experiments: {
        provideExternalRuntime: true, // so remotes don't have to include it.
        optimization: {
          target: 'web',
        }
      },
      name: 'host',
      shared,
      shareStrategy: 'loaded-first',
      runtimePlugins: [path.resolve(__dirname, 'webpack', './stripes-injected-mf-runtime-plugin')],
    }),
  );

  return config;
};

function addRemoteMFConfig(config, options) {
  const { name, mainEntry } = options;

  // singleton: true, eager: false, import: false options are set to ensure that shared modules are
  // not included in the remote module bundle, but instead loaded from the host app at runtime.
  // This keeps the remote module bundle smaller and avoids potential version conflicts between host and remote.
  const shared = processShared(getHostAppSingletons(), { singleton: true, eager: false, import: false });
  config.plugins.push(
    new ModuleFederationPlugin({
      library: { type: 'var', name },
      name,
      filename: 'remoteEntry.js',
      exposes: {
        './MainEntry': mainEntry,
      },
      shared,
      experiments: {
        externalRuntime: true, // remotes use the runtime provided by the host.
        optimization: {
          target: 'web', // further reduce size of the bundle.
        }
      },
      shareStrategy: 'loaded-first',
      // runtime plugins of the host are not automatically shared with remotes, so we
      // inject them via another plugin.
      // Without this, the remotes would all have to be rebuilt to pick up changes
      // to runtime plugins. With this, we only have to rebuild the host app.
      runtimePlugins: [path.resolve(__dirname, 'webpack', './remote-runtime-plugin')],
    }));

  return config;
}

module.exports = {
  addHostMFConfig,
  addRemoteMFConfig,
};

// This webpack plugin generates a virtual module containing the stripes configuration
// To access this configuration simply import 'stripes-config' within your JavaScript:
//   import { okapi, config, modules } from 'stripes-config';
//
// NOTE: If importing module data for UI purposes such as displaying
// the module name, DO NOT import this module.
// Instead, use the ModulesContext directly or via the withModules/withModule HOCs.

const _ = require('lodash');
const VirtualModulesPlugin = require('webpack-virtual-modules');
const serialize = require('serialize-javascript');
const { SyncHook } = require('tapable');
const StripesBuildError = require('./stripes-build-error');
const stripesSerialize = require('./stripes-serialize');
const logger = require('./logger')('stripesConfigPlugin');

const stripesConfigPluginHooksMap = new WeakMap();

module.exports = class StripesConfigPlugin {
  constructor(options) {
    logger.log('initializing...');

    this.options = _.omit(options, 'branding', 'errorLogging');
  }

  // Establish hooks for other plugins to update the config, providing existing config as context
  static getPluginHooks = (compiler) => {
    let hooks = stripesConfigPluginHooksMap.get(compiler);

    if (!hooks) {
      hooks = {
        beforeWrite: new SyncHook(['config']),
      };

      stripesConfigPluginHooksMap.set(compiler, hooks);
    }

    return hooks;
  }

  apply(compiler) {
    const config = this.options;
    this.config = config;
    // Prep the virtual module now, we will write to it when ready
    this.virtualModule = new VirtualModulesPlugin();
    this.virtualModule.apply(compiler);

    StripesConfigPlugin.getPluginHooks(compiler).beforeWrite.tap(
      { name: 'StripesConfigPlugin', context: true },
      context => Object.assign(context, { config }));

    // Wait until after other plugins to generate virtual stripes-config
    compiler.hooks.afterPlugins.tap('StripesConfigPlugin', (theCompiler) => this.afterPlugins(theCompiler));
  }

  afterPlugins(compiler) {
    // Data provided by other stripes plugins via hooks
    const pluginData = {
      branding: {},
      translations: {},
    };

    StripesConfigPlugin.getPluginHooks(compiler).beforeWrite.call(pluginData);

    // Create a virtual module for Webpack to include in the build
    const stripesVirtualModule = `
      const { okapi, config } = ${serialize(this.config, { space: 2 })};
      const branding = ${stripesSerialize.serializeWithRequire(pluginData.branding)};
      const translations = ${serialize(pluginData.translations, { space: 2 })};
      export { okapi, config, branding, translations };
    `;

    logger.log('writing virtual module...', stripesVirtualModule);
    this.virtualModule.writeModule('node_modules/stripes-config.js', stripesVirtualModule);
  }
};

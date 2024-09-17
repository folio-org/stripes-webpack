const path = require('path');
const { defaultConfig, emptyConfig, mergeConfig } = require('./tenant-config');
const webpackCommon = require('./webpack-common');
const logger = console;

module.exports = class StripesPlatform {
  constructor(stripesConfig, context, options) {
    this.isAppContext = false;
    this.aliases = {};
    this.addAliasesAsModules = true;

    // Start with stripes.config.js or internal defaults
    this.applyDefaultConfig(stripesConfig);

    // Apply any command options last
    this.applyCommandOptions(options);
  }

  applyDefaultConfig(stripesConfig) {
    // TODO: Validate incoming config
    if (stripesConfig) {
      // When modules are specified in a config file, do not automatically apply aliases as modules
      if (stripesConfig.modules) {
        this.addAliasesAsModules = false;
      }
      this.config = mergeConfig(emptyConfig, stripesConfig);
    } else {
      this.config = mergeConfig(emptyConfig, defaultConfig);
    }
  }

  applyCommandOptions(options) {
    if (options) {
      if (options.okapi) {
        this.config.okapi.url = options.okapi;
      }
      if (options.tenant) {
        this.config.okapi.tenant = options.tenant;
      }
      if (options.hasAllPerms) {
        this.config.config.hasAllPerms = true;
      }
      if (options.languages) {
        this.config.config.languages = options.languages;
      }
    }
  }

  getWebpackOverrides(context) {
    const overrides = [];
    overrides.push(webpackCommon.cliResolve(context));
    overrides.push(webpackCommon.cliAliases(this.aliases));
    return overrides;
  }

  getStripesConfig() {
    const config = Object.assign({}, this.config);
    delete config.aliases;
    logger.log('using stripes tenant config:', config);
    return config;
  }
};

// This webpack plugin generates a virtual module containing the stripes tenant branding configuration
// The virtual module contains require()'s needed for webpack to pull images into the bundle.

const defaultBranding = require('../default-assets/branding');
const logger = require('./logger')('stripesBrandingPlugin');
const StripesConfigPlugin = require('./stripes-config-plugin');

module.exports = class StripesBrandingPlugin {
  constructor(options) {
    logger.log('initializing...');
    // TODO: Validate incoming tenantBranding paths
    const tenantBranding = (options && options.tenantBranding) ? options.tenantBranding : {};
    this.branding = Object.assign({}, defaultBranding, tenantBranding);
  }

  apply(compiler) {
    // Hook into stripesConfigPlugin to supply branding config
    StripesConfigPlugin.getPluginHooks(compiler).beforeWrite.tap('StripesTranslationsPlugin', (config) => {
      config.branding = this.branding;
      logger.log('stripesConfigPluginBeforeWrite', config.branding);
    });
  }
};

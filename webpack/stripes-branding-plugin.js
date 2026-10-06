// This webpack plugin generates a virtual module containing the stripes tenant branding configuration
// The virtual module contains require()'s needed for webpack to pull images into the bundle.

import defaultBranding from '../default-assets/branding.js';
import getLogger from './logger.js';
const logger = getLogger('stripesBrandingPlugin');
import StripesConfigPlugin from './stripes-config-plugin.js';

export default class StripesBrandingPlugin {
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

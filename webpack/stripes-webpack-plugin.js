// This webpack plugin wraps all other stripes webpack plugins to simplify inclusion within the webpack config

import StripesConfigPlugin from './stripes-config-plugin.js';
import StripesBrandingPlugin from './stripes-branding-plugin.js';
import StripesErrorLoggingPlugin from './stripes-error-logging-plugin.js';
import StripesTranslationsPlugin from './stripes-translations-plugin.js';
import StripesDuplicatesPlugin from './stripes-duplicate-plugin.js';
import getLogger from './logger.js';
const logger = getLogger('stripesWebpackPlugin');

export default class StripesWebpackPlugin {
  constructor(options) {
    this.stripesConfig = options.stripesConfig;
    this.createDll = options.createDll;
    this.lazy = options.lazy;
  }

  apply(compiler) {
    logger.log('Creating Stripes plugins...');
    const isProduction = compiler.options.mode === 'production';

    const stripesPlugins = [
      new StripesConfigPlugin(this.stripesConfig, this.lazy),
      new StripesTranslationsPlugin(this.stripesConfig),
      new StripesDuplicatesPlugin(this.stripesConfig),
    ];

    if (!this.createDll) {
      stripesPlugins.push(new StripesBrandingPlugin({
        tenantBranding: this.stripesConfig.branding,
        buildAllFavicons: isProduction,
      }));

      stripesPlugins.push(new StripesErrorLoggingPlugin({
        tenantErrorLogging: this.stripesConfig.errorLogging,
      }));
    }

    logger.log('Applying Stripes plugins...');
    stripesPlugins.forEach(plugin => plugin.apply(compiler));
  }
};

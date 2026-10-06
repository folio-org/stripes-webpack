// This webpack plugin generates a virtual module containing the
// error-logging configuration.

import getLogger from './logger.js';
const logger = getLogger('stripesErrorLoggingPlugin');
import StripesConfigPlugin from './stripes-config-plugin.js';

export default class StripesErrorLoggingPlugin {
  constructor(options) {
    logger.log('initializing...');

    const defaultErrorLogging = {};

    const tenantErrorLogging = (options && options.tenantErrorLogging) ? options.tenantErrorLogging : {};
    this.errorLogging = Object.assign({}, defaultErrorLogging, tenantErrorLogging);
  }

  apply(compiler) {
    // Hook into stripesConfigPlugin to supply errorLogging config
    StripesConfigPlugin.getPluginHooks(compiler).beforeWrite.tap('StripesTranslationsPlugin', (config) => {
      config.errorLogging = this.errorLogging;
      logger.log('stripesConfigPluginBeforeWrite', config.errorLogging);
    });
  }
};

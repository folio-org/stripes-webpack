// Vite plugin equivalent of stripes-error-logging-plugin.js
// Handles error logging configuration

export default function StripesErrorLoggingPlugin(options = {}) {
  const errorLogging = options.errorLogging || {};

  return {
    name: 'stripes-error-logging-plugin',
    
    config(config, env) {
      return {
        define: {
          __STRIPES_ERROR_LOGGING__: JSON.stringify(errorLogging),
        },
      };
    },
  };
}

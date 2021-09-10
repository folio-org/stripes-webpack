const { getSharedStyles } = require('./webpack/module-paths');

module.exports = (config, context) => {

  // stripes components doesn't need these aliases since to it, the references are internal.
  if (context.moduleName !== '@folio/stripes-components') {
    // aliasing the interactionStyles.css and variables.css as resolving those can be problematic in a workspace.
    config.resolve.alias = {
      ...config.resolve.alias,
      "./@folio/stripes-components/lib/sharedStyles/interactionStyles.css" : getSharedStyles("lib/sharedStyles/interactionStyles"),
      "./@folio/stripes-components/lib/variables.css": getSharedStyles("lib/variables"),
      "stcom-interactionStyles": getSharedStyles("lib/sharedStyles/interactionStyles"),
      "stcom-variables": getSharedStyles("lib/variables"),
    };

    config.resolve.extensions.push('css');
  }

  return config;
}

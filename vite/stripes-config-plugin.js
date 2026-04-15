// Vite plugin equivalent of stripes-config-plugin.js
// Generates a virtual module containing the stripes configuration

import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import serialize from 'serialize-javascript';

let virtualModuleId = 'virtual:stripes-config';
let resolvedId = `\0${virtualModuleId}`;

export default function StripesConfigPlugin(stripesConfig = {}, lazy = false) {
  let moduleContent = '';

  return {
    name: 'stripes-config-plugin',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedId;
      }
    },
    load(id) {
      if (id === resolvedId) {
        // Generate the config content on-demand
        const config = {
          okapi: stripesConfig.okapi || {},
          modules: stripesConfig.modules || {},
          branding: stripesConfig.branding || {},
          config: stripesConfig.config || {},
        };

        moduleContent = `export const okapi = ${serialize(config.okapi)};
export const modules = ${serialize(config.modules)};
export const branding = ${serialize(config.branding)};
export const config = ${serialize(config.config)};
export default { okapi, modules, branding, config };`;
        
        return moduleContent;
      }
    },
  };
}

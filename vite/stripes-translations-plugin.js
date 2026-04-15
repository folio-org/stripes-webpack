// Vite plugin equivalent of stripes-translations-plugin.js
// Handles translation files for Stripes modules

import fs from 'fs';
import path from 'path';

export default function StripesTranslationsPlugin(options = {}) {
  return {
    name: 'stripes-translations-plugin',
    
    apply: 'build',
    
    resolveId(id) {
      if (id.startsWith('virtual:stripes-translations')) {
        return id;
      }
    },
    
    load(id) {
      if (id === 'virtual:stripes-translations') {
        // Return an empty translations object by default
        return 'export default {};';
      }
    },
    
    config(config, env) {
      return {
        define: {
          __STRIPES_TRANSLATIONS__: JSON.stringify({}),
        },
      };
    },
  };
}

// Vite plugin equivalent of stripes-branding-plugin.js
// Handles branding configuration and favicon

import fs from 'fs';
import path from 'path';

const FAVICON_PATH = './tenant-assets/folio-favicon.png';

export default function StripesBrandingPlugin(stripesConfig = {}) {
  return {
    name: 'stripes-branding-plugin',
    
    apply: 'build',
    
    config(config, env) {
      const branding = stripesConfig.branding || {};
      const favicon = branding.favicon?.src || FAVICON_PATH;
      
      return {
        define: {
          __STRIPES_BRANDING__: JSON.stringify(branding),
        },
      };
    },
    
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const branding = stripesConfig.branding || {};
        const favicon = branding.favicon?.src || FAVICON_PATH;
        
        // Update favicon link if custom favicon exists
        if (favicon && favicon !== FAVICON_PATH) {
          const faviconTag = `<link rel="icon" type="image/png" href="${favicon}">`;
          return html.replace(/<link[^>]*rel="icon"[^>]*>/, faviconTag);
        }
        
        return html;
      },
    },
  };
}

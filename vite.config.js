import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@vitejs/plugin-federation';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import custom plugins (converted from webpack plugins)
import StripesConfigPlugin from './vite/stripes-config-plugin.js';
import StripesWebpackPlugin from './vite/stripes-webpack-plugin.js';
import StripesTranslationsPlugin from './vite/stripes-translations-plugin.js';
import StripesErrorLoggingPlugin from './vite/stripes-error-logging-plugin.js';
import StripesBrandingPlugin from './vite/stripes-branding-plugin.js';

// Common utilities
import { generateStripesAlias } from './vite/module-paths.js';

const FAVICON_PATH = './tenant-assets/folio-favicon.png';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  const isProd = mode === 'production';

  // React doesn't like being included multiple times as can happen when using
  // yarn link. Here we find a more specific path to it by first looking in
  // stripes-core (__dirname) before falling back to the platform or simply react
  const specificReact = generateStripesAlias('react');

  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },

    plugins: [
      react({
        jsxRuntime: 'automatic',
        babel: {
          plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-transform-class-properties', { loose: true }],
            ['@babel/plugin-transform-private-methods', { loose: true }],
            ['@babel/plugin-transform-private-property-in-object', { loose: true }],
            '@babel/plugin-transform-export-namespace-from',
            '@babel/plugin-proposal-function-sent',
            '@babel/plugin-transform-numeric-separator',
            '@babel/plugin-proposal-throw-expressions',
            '@babel/plugin-syntax-import-meta',
            isDev && 'react-refresh/babel',
          ].filter(Boolean),
        },
      }),

      // SVG as React components
      {
        name: 'svgr-loader',
        async resolveId(id) {
          if (id.includes('.svg?icon')) {
            return id;
          }
        },
        async load(id) {
          if (id.includes('.svg?icon')) {
            const filepath = id.replace('?icon', '');
            const content = await fs.promises.readFile(filepath, 'utf-8');
            return `import React from 'react';
import ReactDOM from 'react-dom';
${content}`;
          }
        },
      },

      // CSV loader plugin
      {
        name: 'csv-loader',
        async resolveId(id) {
          if (id.endsWith('.csv')) {
            return id;
          }
        },
        async load(id) {
          if (id.endsWith('.csv')) {
            const content = await fs.promises.readFile(id, 'utf-8');
            const lines = content.trim().split('\n');
            const headers = lines[0].split(',');
            const rows = lines.slice(1).map(line => {
              const values = line.split(',');
              const obj = {};
              headers.forEach((header, index) => {
                obj[header.trim()] = values[index]?.trim() || '';
              });
              return obj;
            });
            return `export default ${JSON.stringify(rows)};`;
          }
        },
      },

      // Handlebars loader plugin
      {
        name: 'handlebars-loader',
        async resolveId(id) {
          if (id.endsWith('.handlebars')) {
            return id;
          }
        },
        async load(id) {
          if (id.endsWith('.handlebars')) {
            const content = await fs.promises.readFile(id, 'utf-8');
            return `export default ${JSON.stringify(content)};`;
          }
        },
      },

      // Raw file loader (appending ?raw to imports)
      {
        name: 'raw-loader',
        async resolveId(id) {
          if (id.includes('?raw')) {
            return id.replace('?raw', '');
          }
        },
        async load(id) {
          if (id.includes('?raw')) {
            const filepath = id.replace('?raw', '');
            try {
              const content = await fs.promises.readFile(filepath, 'utf-8');
              return `export default ${JSON.stringify(content)};`;
            } catch (e) {
              console.warn(`Failed to load raw file: ${filepath}`);
              return 'export default "";';
            }
          }
        },
      },

      // Custom Stripes plugins
      StripesConfigPlugin(),
      StripesWebpackPlugin(),
      StripesTranslationsPlugin(),
      StripesErrorLoggingPlugin(),
      StripesBrandingPlugin(),

      // Module Federation for federated module support
      federation({
        name: 'stripes-host',
        filename: 'remoteEntry.js',
        exposes: {
          '.': './src/index.js',
        },
        shared: {
          react: { singleton: true, requiredVersion: '^18.2.0' },
          'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
          '@folio/stripes-core': { singleton: true },
        },
      }),
    ],

    resolve: {
      alias: {
        react: specificReact,
        'react-hot-loader': path.resolve(__dirname, 'reactHotLoader.js'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },

    css: {
      postcss: path.resolve(__dirname, 'postcss.config.js'),
      preprocessorOptions: {
        css: {
          sourceMap: true,
        },
      },
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isProd ? 'hidden' : true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          entryFileNames: 'bundle.[name].[hash].js',
          chunkFileNames: 'chunk.[name].[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|gif|tiff|bmp|ico/i.test(ext)) {
              return `img/[name].[hash][extname]`;
            } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return `fonts/[name].[hash][extname]`;
            } else if (/mp3|m4a/i.test(ext)) {
              return `sound/[name].[hash][extname]`;
            }
            return `[name].[hash][extname]`;
          },
        },
      },
    },

    server: {
      middlewareMode: false,
      port: 3000,
      host: 'localhost',
      open: false,
      cors: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 3000,
      },
    },

    preview: {
      port: 4173,
      host: 'localhost',
    },

    optimize: {
      esbuild: {
        drop: isProd ? ['console', 'debugger'] : [],
      },
    },
  };
});

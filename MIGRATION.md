# Webpack to Vite Migration Guide

This document outlines the changes made during the migration from Webpack to Vite for stripes-webpack.

## Overview

The stripes-webpack package has been converted from using Webpack as the bundler to using Vite. This migration improves build performance, development experience, and aligns with modern JavaScript tooling practices.

## Key Changes

### 1. Build Configuration

**Webpack:**
- Multiple configuration files: `webpack.config.base.js`, `webpack.config.cli.js`, `webpack.config.cli.dev.js`, `webpack.config.cli.prod.js`, etc.
- Complex plugin system with webpack-specific plugins

**Vite:**
- Single `vite.config.js` file for all configurations
- Environment-based configuration using `import.meta.env`
- Built-in support for development and production modes

### 2. Dependencies

**Removed:**
- webpack (@5.58.1)
- webpack-dev-server
- webpack-dev-middleware
- webpack-hot-middleware
- babel-loader, ts-loader, style-loader, css-loader, post-css-loader
- html-webpack-plugin, mini-css-extract-plugin
- webpack-virtual-modules
- And many other webpack-specific plugins

**Added:**
- vite (^5.1.0)
- @vitejs/plugin-react (for React support)
- @vitejs/plugin-federation (for module federation)
- @vitejs/plugin-basic-ssl (for HTTPS in dev)
- vite-plugin-svgr (for SVG as React components)
- vite-plugin-handlebars (for Handlebars templates)
- vite-plugin-csv (for CSV imports)

### 3. Build Scripts

**Webpack:**
```json
{
  "scripts": {
    "test": "nyc --reporter=html --report-dir=artifacts/coverage --all mocha --opts ./test/mocha.opts './test/webpack/**/*.js'"
  }
}
```

**Vite:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "nyc --reporter=html --report-dir=artifacts/coverage --all mocha --opts ./test/mocha.opts './test/vite/**/*.js'"
  }
}
```

### 4. Plugin System

**Webpack Plugins (now recreated as Vite plugins):**
- `webpack/stripes-config-plugin.js` → `vite/stripes-config-plugin.js`
- `webpack/stripes-webpack-plugin.js` → `vite/stripes-webpack-plugin.js`
- `webpack/stripes-translations-plugin.js` → `vite/stripes-translations-plugin.js`
- `webpack/stripes-error-logging-plugin.js` → `vite/stripes-error-logging-plugin.js`
- `webpack/stripes-branding-plugin.js` → `vite/stripes-branding-plugin.js`

**New approach:**
- Custom loaders for SVG, CSV, and Handlebars files are implemented as Vite plugins
- Virtual module system now uses Vite's virtual module conventions (`virtual:module-name`)

### 5. Loaders

**Webpack Loaders → Vite Plugins:**

| Webpack | Vite | Location |
|---------|------|----------|
| `babel-loader` | `@vitejs/plugin-react` + Babel config | vite.config.js |
| `ts-loader` | Built-in TypeScript support | vite.config.js |
| `@svgr/webpack` | Custom plugin + `vite-plugin-svgr` | vite.config.js |
| `csv-loader` | Custom plugin + `vite-plugin-csv` | vite.config.js |
| `handlebars-loader` | Custom plugin + `vite-plugin-handlebars` | vite.config.js |
| `style-loader` + `css-loader` | Built-in CSS support | vite.config.js |
| `postcss-loader` | Built-in PostCSS support | postcss.config.js |

### 6. CSS Processing

**PostCSS Configuration:**
Changes from webpack's `postcss-loader` options to a centralized `postcss.config.js` (recommended) or inline configuration in `vite.config.js`.

**CSS Modules:**
Vite automatically handles CSS Modules with `?module` query parameter.

### 7. Asset Handling

**Output naming/placement:**

Webpack:
```javascript
{
  filename: './img/[name].[contenthash].[ext]',
  filename: './fonts/[name].[contenthash].[ext]',
  filename: './sound/[name].[contenthash].[ext]',
}
```

Vite:
```javascript
assetFileNames: (assetInfo) => {
  // Logic to determine output path based on asset type
}
```

### 8. Hot Module Replacement (HMR)

**Webpack:**
- Configured via webpack-dev-server
- Required `webpack-hot-middleware` and `webpack-dev-middleware`

**Vite:**
- Built-in HMR support
- Zero-config setup in development
- Configured via `server.hmr` in `vite.config.js`

### 9. Module Federation

**Webpack:**
- `@module-federation/enhanced` plugin with complex configuration

**Vite:**
- `@vitejs/plugin-federation` with simpler API
- Configured in `vite.config.js`

### 10. Entry Point

**Webpack:**
- Entry configured in webpack config files
- Virtual module system for stripes-config

**Vite:**
- Entry point: `src/index.jsx`
- Virtual modules accessed via `virtual:module-name` convention
- Import directly in your application

### 11. Environment Variables

**Webpack:**
- `process.env.NODE_ENV` through webpack.DefinePlugin
- `process.env` needs polyfill

**Vite:**
- `import.meta.env.MODE` and `import.meta.env.DEV`, `import.meta.env.PROD`
- Environment variables prefixed with `VITE_` are exposed
- Fully typed via `vite/client`

### 12. Source Maps

**Webpack:**
- `devtool: 'inline-source-map'` (dev) or `'source-map'` (prod)

**Vite:**
- `sourcemap: true` in build options
- Automatic source maps in development

## File Structure Changes

**Before (Webpack):**
```
stripes-webpack/
├── webpack/
│   ├── stripes-*.js (plugins)
│   ├── build.js
│   ├── serve.js
│   └── ...
├── webpack.config.base.js
├── webpack.config.cli.js
├── webpack.config.cli.dev.js
├── webpack.config.cli.prod.js
└── ...
```

**After (Vite):**
```
stripes-webpack/
├── vite/
│   ├── stripes-*.js (Vite plugins)
│   ├── module-paths.js
│   ├── utils.js
│   └── ...
├── src/
│   ├── index.jsx (entry point)
│   └── ...
├── vite.config.js (single configuration)
├── postcss.config.js (if separate)
└── ...
```

## Migration Checklist

- [x] Update `package.json` with Vite dependencies
- [x] Create `vite.config.js`
- [x] Convert webpack plugins to Vite plugins
- [x] Create `/vite` directory with plugin files
- [x] Create entry point component
- [x] Update build scripts
- [ ] Update test configuration
- [ ] Migrate webpack-specific code in consumers
- [ ] Update CI/CD pipelines
- [ ] Test development server
- [ ] Test production build

## Usage

### Development Server

```bash
npm run dev
```

Starts the Vite development server on `http://localhost:3000`.

### Production Build

```bash
npm run build
```

Creates an optimized production build in the `dist` directory.

### Preview Build

```bash
npm run preview
```

Previews the production build locally.

## Breaking Changes

1. **Entry Point**: Applications must now import from `src/index.jsx` instead of relying on webpack's virtual module system.

2. **Environment Variables**: Access environment variables via `import.meta.env` instead of `process.env`.

3. **Config Import**: Stripes config is now imported from `virtual:stripes-config` instead of `stripes-config`.

4. **Babel Options**: Babel configuration is now specified in `vite.config.js` via `@vitejs/plugin-react` instead of separate `babel-loader` configuration.

5. **Handlebars**: Templates must be imported with the `.handlebars` extension.

6. **CSV**: CSV files can be imported and automatically parsed.

## Performance Improvements

- **Faster Dev Server**: Vite's instant server start due to ES modules
- **Faster HMR**: Near-instantaneous hot module replacement
- **Smaller Dependencies**: Removed ~20 webpack-specific packages
- **Better TypeScript Support**: Vite has built-in TypeScript support
- **Modern Output**: ES2020 target by default (configurable)

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure all imports use correct paths
   - Check that `.ts`, `.tsx`, `.jsx` extensions are included in `resolve.extensions`

2. **CSS not loading**
   - Verify CSS imports in component files
   - Check PostCSS configuration in `vite.config.js` or `postcss.config.js`

3. **Assets not found**
   - Ensure public assets are in `public/` directory
   - Use correct paths relative to entry HTML file

4. **HMR not working**
   - Check `server.hmr` configuration in `vite.config.js`
   - Verify WebSocket connection in browser DevTools

## More Information

- [Vite Documentation](https://vitejs.dev/)
- [Vite Migration Guide](https://vitejs.dev/guide/migration.html)
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react)
- [@vitejs/plugin-federation](https://github.com/originjs/vite-plugin-federation)

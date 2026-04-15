# Vite Configuration Guide

This directory contains the Vite configuration for building Stripes applications. This replaces the previous webpack-based build system.

## Directory Structure

```
vite/
├── stripes-config-plugin.js      # Virtual config module generator
├── stripes-webpack-plugin.js     # Stripes build optimizer
├── stripes-translations-plugin.js # Translation file handling
├── stripes-error-logging-plugin.js # Error logging configuration
├── stripes-branding-plugin.js    # Branding & favicon handling
├── module-paths.js               # Module resolution utilities
├── utils.js                      # Helper utilities
├── logger.js                     # Logging utility
├── babel-options.js              # Babel configuration options
├── env-config.js                 # Environment variable loader
└── dev-server.js                 # Development server setup
```

## Key Files

### vite.config.js

The main Vite configuration file. It defines:
- React plugin configuration with Babel setup
- Custom loaders for SVG, CSV, and Handlebars files
- PostCSS configuration
- Build optimization settings
- Development server settings
- Module Federation configuration

### postcss.config.js

PostCSS configuration for CSS processing:
- CSS imports and variables
- Autoprefixer for browser compatibility
- Custom media queries
- CSS-in-JS support

### Babel Configuration

Babel configuration is embedded in `vite.config.js` through the `@vitejs/plugin-react` plugin configuration:
- Decorators support (legacy mode)
- Private fields and methods
- Modern JavaScript features
- React JSX (automatic runtime)

## Usage

### Development

```bash
npm run dev
```

Starts the Vite development server with:
- Hot Module Replacement (HMR)
- Fast refresh on code changes
- Source maps for debugging

### Production Build

```bash
npm run build
```

Creates an optimized production build:
- Code splitting and lazy loading
- Minification with esbuild
- Source maps (hidden by default in prod)
- Optimized assets

### Preview Production Build

```bash
npm run preview
```

Locally previews the production build for testing before deployment.

## Configuration

### Environment Variables

#### Development Server

Edit `vite.config.js` `server` section:

```javascript
server: {
  port: 3000,        // Port number
  host: 'localhost', // Host to bind to
  cors: true,        // Enable CORS
  hmr: {             // Hot Module Replacement config
    protocol: 'ws',
    host: 'localhost',
    port: 3000,
  }
}
```

#### Build Optimization

Edit `vite.config.js` `build` section:

```javascript
build: {
  target: 'es2020',           // ECMAScript target version
  outDir: 'dist',             // Output directory
  minify: 'esbuild',          // Minification tool
  rollupOptions: { /* ... */ } // Rollup configuration
}
```

### Custom Stripes Plugins

#### Adding a New Plugin

1. Create a new file in `vite/` (e.g., `my-plugin.js`)
2. Implement a Vite plugin:

```javascript
export default function MyPlugin(options = {}) {
  return {
    name: 'my-plugin',
    apply: 'build', // 'build' or 'serve' or both
    
    // Vite plugin hooks
    resolveId(id) { /* ... */ },
    load(id) { /* ... */ },
    transform(code, id) { /* ... */ },
  };
}
```

3. Import and add to `vite.config.js`:

```javascript
import MyPlugin from './vite/my-plugin.js';

// In defineConfig plugins array:
plugins: [
  MyPlugin(),
  // other plugins...
]
```

## Asset Handling

### Images

- **PNGs, JPGs, GIFs**: Automatically placed in `dist/img/`
- **SVG with React**: Use query param `?icon` to import as component
- **SVG inline**: Default import returns optimized SVG

### Fonts

- **Supported formats**: woff, woff2, eot, ttf, otf
- **Output location**: `dist/fonts/`

### Media

- **Audio files**: mp3, m4a
- **Output location**: `dist/sound/`

### CSS

- **CSS Modules**: Use `module.css` extension or `?module` query
- **SCSS/LESS**: Not included by default, can be added via plugins
- **CSS-in-JS**: Use style-in-JS libraries like styled-components

## Module Resolution

The `module-paths.js` utility provides:

- `generateStripesAlias()` - Resolves Stripes module aliasing
- `getModulesPaths()` - Gets paths to application modules
- `getStripesModulesPaths()` - Gets paths to Stripes framework modules
- `getTranspiledCssPaths()` - Gets pre-transpiled CSS paths

Example:

```javascript
import { generateStripesAlias, getModulesPaths } from './vite/module-paths.js';

const reactAlias = generateStripesAlias('react');
const modulePaths = getModulesPaths(stripesConfig.modules);
```

## Virtual Modules

Vite virtual modules provide in-memory modules without filesystem files:

### Stripes Config

```javascript
import { okapi, modules, config } from 'virtual:stripes-config';
```

### Translations

```javascript
import translations from 'virtual:stripes-translations';
```

### Error Logging

Access via global:

```javascript
const errorLoggingConfig = __STRIPES_ERROR_LOGGING__;
```

## CSS Processing

### PostCSS Plugins

Configured in `postcss.config.js`:
- `postcss-import` - Process @import statements
- `postcss-custom-media` - Custom media query support
- `autoprefixer` - Vendor prefix support
- `@csstools/postcss-global-data` - Global CSS variables
- `@csstools/postcss-relative-color-syntax` - Modern color syntax

### CSS Modules

Use with the `module.css` naming convention:

```javascript
import styles from './component.module.css';

export default function Component() {
  return <div className={styles.container}>Content</div>;
}
```

## Source Maps

### Development

- Type: `inline-source-map` (embedded)
- Debug: Full source maps available
- Performance: Slightly slower rebuild

### Production

- Type: `hidden` (source maps generated but not referenced)
- Debug: Source maps available separately
- Performance: Minimal impact
- Security: Source maps not sent to browsers

## Troubleshooting

### Issue: Module not found

**Solution**: Check module path resolution in `module-paths.js`. Ensure modules are installed in correct `node_modules` location.

### Issue: CSS not applying

**Solution**: Verify PostCSS configuration load. Check CSS import statements. Ensure CSS modules are using correct naming.

### Issue: HMR not working

**Solution**: Check browser console for WebSocket errors. Verify `server.hmr` configuration. Restart dev server.

### Issue: Import errors for virtual modules

**Solution**: Ensure plugin is loaded in `vite.config.js`. Check virtual module naming (should start with `virtual:`).

## Performance Tips

1. **Code Splitting**: Vite automatically splits code. Optimize with manual chunks in build options.

2. **Lazy Loading**: Use dynamic imports for route-based code splitting:
   ```javascript
   const Component = lazy(() => import('./Component'));
   ```

3. **Caching**: Leverage Vite's asset versioning with `[hash]` in filenames.

4. **Tree Shaking**: Ensure dependencies export as ES modules for optimal tree shaking.

## Related Documentation

- [MIGRATION.md](../MIGRATION.md) - Detailed migration guide from Webpack
- [vite.config.js](../vite.config.js) - Main configuration file
- [Vite Docs](https://vitejs.dev/) - Official Vite documentation

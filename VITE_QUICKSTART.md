# Vite Quick Start Guide

Migrated from Webpack to Vite! This guide helps you get started.

## What Changed?

- **Bundler**: Webpack → Vite
- **Config**: Multiple files → Single `vite.config.js`
- **Dev Server**: webpack-dev-server → Vite built-in server
- **Faster builds**: ~10x faster cold builds, instant HMR

## Installation

```bash
# Install dependencies (uses new package.json)
npm install
# or
yarn install
```

## Development

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:3000
```

The dev server will:
- Start instantly
- Hot reload on changes (HMR)
- Show errors in browser and console

## Building for Production

```bash
# Build
npm run build

# Preview build
npm run preview
```

Outputs go to `dist/` directory.

## Common Tasks

### Add a New Package

Same as before:
```bash
npm install some-package
```

### Import CSS

```javascript
// Regular CSS
import './styles.css';

// CSS Module
import styles from './styles.module.css';

// PostCSS variables
import '@folio/stripes-components/lib/variables.css';
```

### Import Assets

```javascript
// Images
import logo from './logo.png';

// SVG as React component
import { IconComponent } from './icon.svg?icon';

// SVG inline
import svgString from './inline.svg';

// CSV
import data from './data.csv';

// Handlebars template
import template from './template.handlebars';

// Raw file as string
import config from './config.txt?raw';
```

### Use Environment Variables

```javascript
// In your code
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
const mode = import.meta.env.MODE;
```

Create `.env` files:

```bash
# .env (all environments)
VITE_API_URL=http://api.example.com

# .env.development
VITE_DEBUG=true

# .env.production
VITE_DEBUG=false
```

### Dynamic Imports (Code Splitting)

```javascript
// Lazy load component
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Lazy load module
async function loadModule() {
  const module = await import('./module.js');
  return module;
}
```

### Debug in Browser

```javascript
// Source maps work automatically
import { debugFunction } from './utils.js';

// Set breakpoints in browser DevTools
debugFunction();
```

## Troubleshooting

### "Module not found"

Check that your import path is correct. Vite doesn't auto-resolve missing extensions like some tools do.

```javascript
// ❌ Wrong
import Component from './component';

// ✅ Correct
import Component from './component.jsx';
import Component from './component/index.js';
```

### CSS not loading

Ensure CSS is explicitly imported where it's used:

```javascript
import React from 'react';
import './Component.css'; // Must be here

export function Component() {
  return <div>Content</div>;
}
```

### HMR not working

If hot reload stops working:
1. Check browser console for errors
2. Restart dev server: `npm run dev`
3. Clear browser cache: Press Ctrl+Shift+Delete

### Build size issues

Check bundle analysis:

```bash
npm run build -- --analyze
```

Then look at `dist/stats.json`.

## Performance Tips

1. **Use code splitting**: 
   ```javascript
   const Page = lazy(() => import('./pages/Page'));
   ```

2. **Optimize images**: Use appropriate formats
   - PNG for graphics
   - JPG for photos
   - WebP for modern browsers

3. **Lazy load routes**:
   ```javascript
   const routes = [
     { path: '/', component: lazy(() => import('./Home')) },
     { path: '/about', component: lazy(() => import('./About')) },
   ];
   ```

## More Information

- [Vite Configuration Guide](./vite/README.md)
- [Migration Guide](./MIGRATION.md)
- [Vite Official Docs](https://vitejs.dev/)

## Useful Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Run tests (webpack tests, update needed)
npm test

# Type check (if using TypeScript)
npm run type-check

# Lint code
npm run lint
```

## IDE Setup

### VS Code

Install extensions:
- ES7+ React/Redux/React-Native snippets
- ESLint
- Prettier - Code formatter

Settings (`settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### WebStorm/IntelliJ

- Mark `node_modules` as excluded library
- Enable ES6+ JavaScript
- Configure Prettier as formatter

## Deployment

Build command: `npm run build`

Deploy the `dist/` directory to your hosting service.

The build is fully static - works everywhere!

## Questions?

- Check [Vite docs](https://vitejs.dev/)
- Review [MIGRATION.md](./MIGRATION.md)
- Check [vite/README.md](./vite/README.md)

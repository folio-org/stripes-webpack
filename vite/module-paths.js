import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const logger = {
  log: (message, ...args) => console.log(`[module-paths] ${message}`, ...args),
};

class StripesBuildError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StripesBuildError';
  }
}

function tryResolve(modulePath, options = {}) {
  try {
    return require.resolve(modulePath, options);
  } catch (e) {
    return false;
  }
}

// Generates a resolvable alias for a module with preference given to the
// workspace's version followed by stripes-core's version followed by the platform's, if available
function generateStripesAlias(moduleName) {
  let alias;
  const workspaceModule = path.join(path.resolve(), '..', 'node_modules', moduleName);
  const platformModule = path.join(path.resolve(), 'node_modules', moduleName);
  const coreModule = path.join(__dirname, '..', 'node_modules', moduleName);

  if (tryResolve(workspaceModule)) {
    alias = workspaceModule;
  } else if (tryResolve(platformModule)) {
    alias = platformModule;
  } else if (tryResolve(coreModule)) {
    alias = coreModule;
  } else {
    throw new StripesBuildError(`generateStripesAlias: Unable to locate a resolvable alias for ${moduleName} module`);
  }
  return alias;
}

// Get paths for all modules
function getModulesPaths(modules = {}) {
  return Object.keys(modules).map(moduleName => {
    const modulePath = tryResolve(moduleName);
    return modulePath ? path.dirname(modulePath) : null;
  }).filter(Boolean);
}

// Get stripes modules paths
function getStripesModulesPaths() {
  const stripesModules = [
    '@folio/stripes-core',
    '@folio/stripes-ui',
    '@folio/stripes-components',
  ];
  return stripesModules.map(moduleName => {
    const modulePath = tryResolve(moduleName);
    return modulePath ? path.dirname(modulePath) : null;
  }).filter(Boolean);
}

// Get transpiled CSS paths
function getTranspiledCssPaths(modulePaths = []) {
  return modulePaths
    .map(modulePath => {
      const cssPath = path.join(modulePath, 'dist', 'style.css');
      try {
        if (require.resolve(cssPath)) {
          return cssPath;
        }
      } catch (e) {
        // ignore
      }
      return null;
    })
    .filter(Boolean);
}

// Get transpiled modules
function getTranspiledModules(modulePaths = []) {
  return modulePaths
    .map(modulePath => {
      const distPath = path.join(modulePath, 'dist');
      try {
        require.resolve(distPath);
        return distPath;
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

export {
  tryResolve,
  generateStripesAlias,
  getModulesPaths,
  getStripesModulesPaths,
  getTranspiledCssPaths,
  getTranspiledModules,
  StripesBuildError,
};

const fs = require('fs');
const path = require('path');
const { parseAllModules } = require('../webpack/stripes-module-parser');
const defaultBranding = require('../default-assets/branding');
const { generateStripesAlias } = require('../webpack/module-paths');
const modulePaths = require('../webpack/module-paths');

const lodashInteropModules = [
  'lodash/camelCase',
  'lodash/cloneDeep',
  'lodash/debounce',
  'lodash/find',
  'lodash/findIndex',
  'lodash/first',
  'lodash/flow',
  'lodash/forOwn',
  'lodash/fp',
  'lodash/get',
  'lodash/has',
  'lodash/includes',
  'lodash/indexOf',
  'lodash/isArray',
  'lodash/isBoolean',
  'lodash/isEmpty',
  'lodash/isEqual',
  'lodash/isEqualWith',
  'lodash/isFunction',
  'lodash/isNil',
  'lodash/kebabCase',
  'lodash/keyBy',
  'lodash/last',
  'lodash/mapValues',
  'lodash/merge',
  'lodash/noop',
  'lodash/omit',
  'lodash/orderBy',
  'lodash/pick',
  'lodash/pickBy',
  'lodash/sortBy',
  'lodash/take',
  'lodash/times',
  'lodash/toPath',
  'lodash/uniqWith',
  'lodash/uniqueId',
];

const dayjsInteropModules = [
  'dayjs/plugin/arraySupport',
  'dayjs/plugin/customParseFormat',
  'dayjs/plugin/isBetween',
  'dayjs/plugin/isSameOrAfter',
  'dayjs/plugin/isSameOrBefore',
  'dayjs/plugin/isoWeek',
  'dayjs/plugin/localeData',
  'dayjs/plugin/localizedFormat',
  'dayjs/plugin/objectSupport',
  'dayjs/plugin/timezone',
  'dayjs/plugin/utc',
  'dayjs/plugin/weekday',
  'dayjs/plugin/weekOfYear',
];

const propTypesExtraInteropModules = [
  'prop-types-extra',
  'prop-types-extra/lib/all',
  'prop-types-extra/lib/componentOrElement',
  'prop-types-extra/lib/deprecated',
  'prop-types-extra/lib/elementType',
  'prop-types-extra/lib/isRequiredForA11y',
];

const semverInteropModules = [
  'semver/functions/satisfies',
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function toImportSpecifier(fromDir, targetPath) {
  const relativePath = normalizePath(path.relative(fromDir, targetPath));
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function findLocalOrCoreModule(moduleName, cwd) {
  try {
    return require.resolve(moduleName, { paths: [cwd, __dirname, path.join(__dirname, '..')] });
  } catch (error) {
    return require.resolve(moduleName);
  }
}

function loadProjectModule(moduleName, cwd) {
  return require(findLocalOrCoreModule(moduleName, cwd)); // eslint-disable-line global-require, import/no-dynamic-require
}

function makeBase(publicPath) {
  if (!publicPath) {
    return '/';
  }

  return publicPath.endsWith('/') ? publicPath : `${publicPath}/`;
}

function resolveCssImportPath(source, importer) {
  if (path.isAbsolute(source)) {
    return source;
  }

  const importerFile = importer.split('?')[0];
  const importerDir = path.dirname(importerFile);

  if (source.startsWith('.')) {
    return path.resolve(importerDir, source);
  }

  const resolutionPaths = [
    importerDir,
    process.cwd(),
    __dirname,
    path.join(__dirname, '..'),
  ];
  const attempts = [source];

  if (!path.extname(source)) {
    attempts.push(`${source}.css`);
    attempts.push(path.join(source, 'index.css'));
  }

  for (const request of attempts) {
    try {
      return require.resolve(request, { paths: resolutionPaths });
    } catch (error) {
      // Try the next legacy CSS resolution candidate.
    }
  }

  return require.resolve(source, { paths: resolutionPaths });
}

function rewriteLegacyCssSource(code, sourcePath) {
  const resolveCssReference = (request) => {
    const normalizedRequest = request.startsWith('~') ? request.slice(1) : request;
    const resolvedPath = resolveCssImportPath(normalizedRequest, sourcePath);
    return normalizePath(resolvedPath);
  };

  return code
    .replace(
      /(@import\s+)(['"])([^'"]+)(\2)/g,
      (full, prefix, quote, importPath, suffix) => {
        if (/^(data:|https?:)/.test(importPath)) {
          return full;
        }

        return `${prefix}${quote}${resolveCssReference(importPath)}${suffix}`;
      }
    )
    .replace(
      /(composes:\s+[^;]+?\s+from\s+)(['"])([^'"]+)(\2)/g,
      (full, prefix, quote, importPath, suffix) => `${prefix}${quote}${resolveCssReference(importPath)}${suffix}`
    )
    .replace(
      /(url\(\s*)(['"]?)(~[^'")]+)(\2\s*\))/g,
      (full, prefix, quote, importPath, suffix) => `${prefix}${quote}${resolveCssReference(importPath.slice(1))}${suffix}`
    );
}

function stripBrokenSourceMapReferences() {
  const brokenSourceMapPatterns = [
    /node_modules\/react-image\/esm\/.*\.js$/,
    /node_modules\/@formatjs\/fast-memoize\/lib\/index\.js$/,
  ];

  return {
    name: 'strip-broken-sourcemaps',
    enforce: 'pre',
    transform(code, id) {
      if (!brokenSourceMapPatterns.some((pattern) => pattern.test(id))) {
        return null;
      }

      return {
        code: code.replace(/\n\/\/# sourceMappingURL=.*$/gm, ''),
        map: null,
      };
    },
  };
}

function rewriteWebpackStyleLoaderImports(cwd) {
  const quillCssPath = findLocalOrCoreModule('react-quill/dist/quill.snow.css', cwd);

  return {
    name: 'rewrite-webpack-style-loader-imports',
    resolveId(source) {
      if (source === '!style-loader!css-loader!react-quill/dist/quill.snow.css') {
        return quillCssPath;
      }

      return null;
    },
  };
}

function rewriteLegacyCssModuleImports() {
  const legacyCssModuleMarker = 'stripes-legacy-module-css';

  return {
    name: 'rewrite-legacy-css-module-imports',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.includes(legacyCssModuleMarker) || !importer) {
        return null;
      }

      const [rawSource] = source.split('?');
      const resolvedPath = resolveCssImportPath(rawSource, importer);
      return `${resolvedPath}.module.css?${legacyCssModuleMarker}`;
    },
    load(id) {
      if (!id.endsWith(`.module.css?${legacyCssModuleMarker}`)) {
        return null;
      }

      const sourcePath = id
        .replace(`?${legacyCssModuleMarker}`, '')
        .replace(/\.module\.css$/, '');

      return rewriteLegacyCssSource(fs.readFileSync(sourcePath, 'utf8'), sourcePath);
    },
    transform(code, id) {
      const cleanId = id.split('?')[0];

      if (!/node_modules\/@folio\/.*\.[jt]sx?$/.test(cleanId)) {
        return null;
      }

      const rewritten = code.replace(
        /import\s+([^'";]+?)\s+from\s+(['"])([^'"]+\.css)(\?[^'"]*)?\2;/g,
        (full, bindings, quote, importPath, query = '') => {
          if (!bindings || bindings.trim().startsWith('{') || query.includes('module')) {
            return full;
          }

          const markedQuery = query ? `${query}&${legacyCssModuleMarker}` : `?${legacyCssModuleMarker}`;
          return `import ${bindings} from ${quote}${importPath}${markedQuery}${quote};`;
        }
      );

      return rewritten === code ? null : rewritten;
    },
  };
}

function serializeValue(value) {
  if (typeof value === 'function') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => serializeValue(entry)).join(', ')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, entryValue]) => `${JSON.stringify(key)}: ${serializeValue(entryValue)}`);
    return `{ ${entries.join(', ')} }`;
  }

  return JSON.stringify(value);
}

function assetImportsForObject(value, generatedDir, state) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => assetImportsForObject(entry, generatedDir, state)).join(', ')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, entryValue]) => {
      if (key === 'src' && typeof entryValue === 'string' && entryValue !== '') {
        const absolutePath = path.isAbsolute(entryValue) ? entryValue : path.resolve(entryValue);
        const variableName = `asset${state.imports.length}`;
        state.imports.push(`import ${variableName} from '${toImportSpecifier(generatedDir, absolutePath)}';`);
        return `${JSON.stringify(key)}: ${variableName}`;
      }

      return `${JSON.stringify(key)}: ${assetImportsForObject(entryValue, generatedDir, state)}`;
    });

    return `{ ${entries.join(', ')} }`;
  }

  return serializeValue(value);
}

function buildModuleConfigCode(modulesConfig) {
  const importStatements = [];
  const importedModules = new Map();

  const getModuleReference = (moduleName) => {
    if (!importedModules.has(moduleName)) {
      const variableName = `moduleImport${importedModules.size}`;
      importedModules.set(moduleName, variableName);
      importStatements.push(`import * as ${variableName} from '${moduleName}';`);
    }

    return importedModules.get(moduleName);
  };

  const buildModuleEntry = (entry) => {
    const moduleRef = getModuleReference(entry.module);
    const plainEntry = Object.assign({}, entry);
    delete plainEntry.getModule;
    delete plainEntry.getDynamicModule;
    delete plainEntry.cachedModule;

    const properties = Object.entries(plainEntry).map(([key, value]) => `${JSON.stringify(key)}: ${serializeValue(value)}`);

    if (entry.getDynamicModule) {
      properties.push(`"getDynamicModule": () => import('${entry.module}')`);
    } else {
      properties.push(`"getModule": () => (${moduleRef}.default || ${moduleRef})`);
    }

    return `{ ${properties.join(', ')} }`;
  };

  const moduleTypes = Object.entries(modulesConfig).map(([type, entries]) => {
    const serializedEntries = (entries || []).map((entry) => buildModuleEntry(entry)).join(', ');
    return `${JSON.stringify(type)}: [${serializedEntries}]`;
  });

  return {
    importStatements,
    modulesCode: `{ ${moduleTypes.join(', ')} }`,
  };
}

function getTranslationModuleName(moduleName) {
  const name = moduleName.replace(/.*\//, '');
  return name.indexOf('stripes-') === 0 ? name : `ui-${name}`;
}

function prefixTranslationKeys(moduleName, translations) {
  const prefix = `${getTranslationModuleName(moduleName)}.`;

  return Object.keys(translations).reduce((acc, key) => {
    acc[`${prefix}${key}`] = translations[key];
    return acc;
  }, {});
}

function mergeTranslations(target, source) {
  Object.entries(source).forEach(([language, entries]) => {
    target[language] = Object.assign(target[language] || {}, entries);
  });
}

function loadTranslationsDirectory(moduleName, dir, languageFilter) {
  const sourceDir = fs.existsSync(path.join(dir, 'compiled')) ? path.join(dir, 'compiled') : dir;
  const englishPath = path.join(sourceDir, 'en.json');
  const englishTranslations = fs.existsSync(englishPath)
    ? prefixTranslationKeys(moduleName, JSON.parse(fs.readFileSync(englishPath, 'utf8')))
    : {};
  const moduleTranslations = {};

  fs.readdirSync(sourceDir, { withFileTypes: true }).forEach((entry) => {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      return;
    }

    const language = entry.name.replace('.json', '');
    if (languageFilter.length && !languageFilter.includes(language)) {
      return;
    }

    const translations = JSON.parse(fs.readFileSync(path.join(sourceDir, entry.name), 'utf8'));
    moduleTranslations[language] = Object.assign(
      {},
      englishTranslations,
      prefixTranslationKeys(moduleName, translations)
    );
  });

  return moduleTranslations;
}

function loadTranslationsPackageJson(moduleName, packageJson, languageFilter) {
  return Object.keys(packageJson.stripes.translations).reduce((acc, language) => {
    if (!languageFilter.length || languageFilter.includes(language)) {
      acc[language] = prefixTranslationKeys(moduleName, packageJson.stripes.translations[language]);
    }
    return acc;
  }, {});
}

function gatherTranslations(stripesConfig, aliases) {
  const configuredModules = Object.assign({
    '@folio/stripes-core': {},
    '@folio/stripes-components': {},
    '@folio/stripes-smart-components': {},
    '@folio/stripes-form': {},
    '@folio/stripes-ui': {},
  }, stripesConfig?.modules || {});
  const languageFilter = stripesConfig?.config?.languages || [];
  const allTranslations = {};

  for (const mod of Object.keys(configuredModules)) {
    const locateContext = configuredModules[mod].resolvedPath || process.cwd();
    const packageJsonPath = modulePaths.locateStripesModule(locateContext, mod, aliases || {}, 'package.json');

    if (!packageJsonPath) {
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const moduleName = getTranslationModuleName(mod);
    const preferredDir = packageJsonPath.replace('package.json', `translations/${moduleName}`);
    const fallbackDir = packageJsonPath.replace('package.json', 'translations');
    const translationDir = fs.existsSync(preferredDir) ? preferredDir : fallbackDir;

    if (fs.existsSync(translationDir)) {
      mergeTranslations(allTranslations, loadTranslationsDirectory(mod, translationDir, languageFilter));
    } else if (packageJson.stripes?.translations) {
      mergeTranslations(allTranslations, loadTranslationsPackageJson(mod, packageJson, languageFilter));
    }
  }

  return allTranslations;
}

function writeTranslations(targetDir, base, allTranslations) {
  const translationsDir = path.join(targetDir, 'translations');
  ensureDir(translationsDir);

  return Object.keys(allTranslations).reduce((acc, language) => {
    const fileName = `${language}.json`;
    fs.writeFileSync(path.join(translationsDir, fileName), JSON.stringify(allTranslations[language]), 'utf8');
    acc[language] = `${base}translations/${fileName}`;
    return acc;
  }, {});
}

function buildStripesConfigSource(stripesConfig, options, generatedDir, translations) {
  const enabledModules = stripesConfig?.modules || {};
  const { config, metadata, icons, warnings } = parseAllModules(
    enabledModules,
    process.cwd(),
    options.aliases || {},
    !!options.lazy
  );

  warnings.forEach((warning) => console.warn(warning)); // eslint-disable-line no-console

  const mergedConfig = Object.assign({
    modules: {
      app: [],
      handler: [],
      plugin: [],
      settings: [],
    },
  }, stripesConfig, { modules: config });
  delete mergedConfig.branding;
  delete mergedConfig.errorLogging;
  mergedConfig.config = mergedConfig.config || {};
  mergedConfig.config.isLazy = !!options.lazy;

  const assetState = { imports: [] };
  const brandingCode = assetImportsForObject(Object.assign({}, defaultBranding, stripesConfig?.branding || {}), generatedDir, assetState);
  const metadataCode = assetImportsForObject(metadata, generatedDir, assetState);
  const iconsCode = assetImportsForObject(icons, generatedDir, assetState);
  const { importStatements: moduleImportStatements, modulesCode } = buildModuleConfigCode(config);
  const configWithoutModules = Object.assign({}, mergedConfig);
  delete configWithoutModules.modules;

  return `${assetState.imports.join('\n')}
${moduleImportStatements.join('\n')}

const { okapi, config } = ${serializeValue(configWithoutModules)};
const modules = ${modulesCode};
const branding = ${brandingCode};
const errorLogging = {};
const translations = ${serializeValue(translations)};
const metadata = ${metadataCode};
const icons = ${iconsCode};

export { branding, config, errorLogging, icons, metadata, modules, okapi, translations };
`;
}

function writeGeneratedAppFiles(stripesConfig, options) {
  const generatedDir = path.join(process.cwd(), '.stripes-vite');
  const base = makeBase(options.publicPath);
  ensureDir(generatedDir);

  const allTranslations = gatherTranslations(stripesConfig, options.aliases);
  const translations = writeTranslations(generatedDir, base, allTranslations);
  const stripesConfigSource = buildStripesConfigSource(stripesConfig, options, generatedDir, translations);
  const stripesConfigPath = path.join(generatedDir, 'stripes-config.mjs');
  fs.writeFileSync(stripesConfigPath, stripesConfigSource, 'utf8');

  const entrySource = `
import '@folio/stripes-components/lib/global.css';
import '@folio/stripes-components/lib/variables.css';
import faviconUrl from './favicon-entry.js';
import { modules } from './stripes-config.mjs';

const existingFavicon = document.querySelector("link[rel='icon']");
if (existingFavicon) {
  existingFavicon.href = faviconUrl;
} else {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = faviconUrl;
  document.head.appendChild(link);
}

const defaultApp = modules?.app?.[0];
const defaultPath = defaultApp?.home || defaultApp?.route;

if (window.location.pathname === '/' && defaultPath) {
  window.history.replaceState(window.history.state, '', defaultPath);
}

await import('@folio/stripes-ui');
`;
  fs.writeFileSync(path.join(generatedDir, 'entry.js'), entrySource, 'utf8');

  const faviconPath = path.isAbsolute(stripesConfig?.branding?.favicon?.src || '')
    ? stripesConfig.branding.favicon.src
    : path.resolve(stripesConfig?.branding?.favicon?.src || defaultBranding.favicon.src);
  fs.writeFileSync(
    path.join(generatedDir, 'favicon-entry.js'),
    `export { default } from '${toImportSpecifier(generatedDir, faviconPath)}';\n`,
    'utf8'
  );

  const templatePath = fs.existsSync(path.join(process.cwd(), 'index.html'))
    ? path.join(process.cwd(), 'index.html')
    : path.join(__dirname, '..', 'index.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  if (!html.includes('/entry.js')) {
    html = html.replace('</body>', '    <script type="module" src="/entry.js"></script>\n  </body>');
  }
  fs.writeFileSync(path.join(generatedDir, 'index.html'), html, 'utf8');

  const hoistShimPath = path.join(generatedDir, 'hoist-non-react-statics-shim.mjs');
  const hoistModulePath = findLocalOrCoreModule('hoist-non-react-statics', process.cwd());
  fs.writeFileSync(
    hoistShimPath,
    `import * as hoistNonReactStaticsModule from '${normalizePath(hoistModulePath)}';
const hoistNonReactStatics = hoistNonReactStaticsModule.default || hoistNonReactStaticsModule;
export default hoistNonReactStatics;
export * from '${normalizePath(hoistModulePath)}';
`,
    'utf8'
  );

  const momentRangeShimPath = path.join(generatedDir, 'moment-range-shim.mjs');
  const momentRangeModulePath = findLocalOrCoreModule('moment-range', process.cwd());
  fs.writeFileSync(
    momentRangeShimPath,
    `import momentRangeModule from '${normalizePath(momentRangeModulePath)}';
const momentRange = momentRangeModule.default || momentRangeModule;
const { DateRange, extendMoment } = momentRange;
export { DateRange, extendMoment };
export default momentRange;
`,
    'utf8'
  );

  const sourcemappedStacktraceShimPath = path.join(generatedDir, 'sourcemapped-stacktrace-shim.mjs');
  const sourcemappedStacktraceModulePath = findLocalOrCoreModule('sourcemapped-stacktrace', process.cwd());
  fs.writeFileSync(
    sourcemappedStacktraceShimPath,
    `import * as sourcemappedStacktraceModule from '${normalizePath(sourcemappedStacktraceModulePath)}';
const sourcemappedStacktrace = sourcemappedStacktraceModule.default || sourcemappedStacktraceModule;
const { mapStackTrace } = sourcemappedStacktrace;
export { mapStackTrace };
export default sourcemappedStacktrace;
`,
    'utf8'
  );

  const stripesLoggerShimPath = path.join(generatedDir, 'stripes-logger-shim.mjs');
  const stripesLoggerModulePath = findLocalOrCoreModule('@folio/stripes-logger', process.cwd());
  fs.writeFileSync(
    stripesLoggerShimPath,
    `import * as stripesLoggerModule from '${normalizePath(stripesLoggerModulePath)}';
const Logger = stripesLoggerModule.default || stripesLoggerModule;
export default Logger;
`,
    'utf8'
  );

  const reduxLoggerShimPath = path.join(generatedDir, 'redux-logger-shim.mjs');
  const reduxLoggerModulePath = findLocalOrCoreModule('redux-logger', process.cwd());
  fs.writeFileSync(
    reduxLoggerShimPath,
    `import * as reduxLoggerModule from '${normalizePath(reduxLoggerModulePath)}';
const reduxLogger = reduxLoggerModule.default || reduxLoggerModule;
const { createLogger, defaults, logger } = reduxLogger;
export { createLogger, defaults, logger };
export default reduxLogger;
`,
    'utf8'
  );

  const reactDomClientShimPath = path.join(generatedDir, 'react-dom-client-shim.mjs');
  const reactDomClientModulePath = findLocalOrCoreModule('react-dom/client', process.cwd());
  fs.writeFileSync(
    reactDomClientShimPath,
    `import * as reactDomClientModule from '${normalizePath(reactDomClientModulePath)}';
const reactDomClient = reactDomClientModule.default || reactDomClientModule;
const { createRoot, hydrateRoot } = reactDomClient;
export { createRoot, hydrateRoot };
export default reactDomClient;
`,
    'utf8'
  );

  const flatShimPath = path.join(generatedDir, 'flat-shim.mjs');
  const flatModulePath = findLocalOrCoreModule('flat', process.cwd());
  fs.writeFileSync(
    flatShimPath,
    `import * as flatModule from '${normalizePath(flatModulePath)}';
const flat = flatModule.default || flatModule;
const { flatten, unflatten } = flat;
export { flatten, unflatten };
export default flat;
`,
    'utf8'
  );

  const reactCopyToClipboardShimPath = path.join(generatedDir, 'react-copy-to-clipboard-shim.mjs');
  const reactCopyToClipboardModulePath = findLocalOrCoreModule('react-copy-to-clipboard', process.cwd());
  fs.writeFileSync(
    reactCopyToClipboardShimPath,
    `import * as reactCopyToClipboardModule from '${normalizePath(reactCopyToClipboardModulePath)}';
const reactCopyToClipboard = reactCopyToClipboardModule.default || reactCopyToClipboardModule;
const CopyToClipboard = reactCopyToClipboard.CopyToClipboard || reactCopyToClipboard;
export { CopyToClipboard };
export default CopyToClipboard;
`,
    'utf8'
  );

  const rehooksLocalStorageShimPath = path.join(generatedDir, 'rehooks-local-storage-shim.mjs');
  const rehooksLocalStorageModulePath = findLocalOrCoreModule('@rehooks/local-storage', process.cwd());
  fs.writeFileSync(
    rehooksLocalStorageShimPath,
    `import * as rehooksLocalStorageModule from '${normalizePath(rehooksLocalStorageModulePath)}';
const rehooksLocalStorage = rehooksLocalStorageModule.default || rehooksLocalStorageModule;
const {
  useLocalStorage,
  writeStorage,
  deleteFromStorage,
} = rehooksLocalStorage;
export { deleteFromStorage, useLocalStorage, writeStorage };
export default rehooksLocalStorage;
`,
    'utf8'
  );

  return {
    base,
    generatedDir,
    hoistShimPath,
    momentRangeShimPath,
    sourcemappedStacktraceShimPath,
    stripesLoggerShimPath,
    reduxLoggerShimPath,
    reactDomClientShimPath,
    flatShimPath,
    reactCopyToClipboardShimPath,
    rehooksLocalStorageShimPath,
    stripesConfigPath,
  };
}

function getViteConfig(stripesConfig, options = {}, command) {
  const {
    generatedDir,
    hoistShimPath,
    momentRangeShimPath,
    sourcemappedStacktraceShimPath,
    stripesLoggerShimPath,
    reduxLoggerShimPath,
    reactDomClientShimPath,
    flatShimPath,
    reactCopyToClipboardShimPath,
    rehooksLocalStorageShimPath,
    stripesConfigPath,
    base,
  } = writeGeneratedAppFiles(stripesConfig, options);
  const react = loadProjectModule('@vitejs/plugin-react', process.cwd());
  const specificReact = generateStripesAlias('react');
  const stripesReactHotkeysPath = findLocalOrCoreModule('@folio/stripes-react-hotkeys/es/index.js', process.cwd());
  const stripesLoggerPackagePath = findLocalOrCoreModule('@folio/stripes-logger/package.json', process.cwd());
  const processBrowserPath = findLocalOrCoreModule('process/browser.js', process.cwd());
  const bufferPath = findLocalOrCoreModule('buffer/', process.cwd());
  const quillCssPath = findLocalOrCoreModule('react-quill/dist/quill.snow.css', process.cwd());

  return {
    root: generatedDir,
    base,
    appType: 'spa',
    plugins: [
      stripBrokenSourceMapReferences(),
      rewriteLegacyCssModuleImports(),
      rewriteWebpackStyleLoaderImports(process.cwd()),
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', { target: '18', runtimeModule: 'react-compiler-runtime' }]],
        },
        include: [
          /\.js$/,
          /\.jsx$/,
          /\.ts$/,
          /\.tsx$/,
          /node_modules\/@folio\/.*\.js$/,
        ],
      }),
    ],
    resolve: {
      alias: Object.assign({
        'stripes-config': stripesConfigPath,
        'hoist-non-react-statics': hoistShimPath,
        'moment-range': momentRangeShimPath,
        'sourcemapped-stacktrace': sourcemappedStacktraceShimPath,
        '@folio/stripes-logger/package': stripesLoggerPackagePath,
        '@folio/stripes-logger': stripesLoggerShimPath,
        '@folio/stripes-react-hotkeys': stripesReactHotkeysPath,
        '@rehooks/local-storage': rehooksLocalStorageShimPath,
        flat: flatShimPath,
        'react-copy-to-clipboard': reactCopyToClipboardShimPath,
        'react-dom/client': reactDomClientShimPath,
        'redux-logger': reduxLoggerShimPath,
        react: specificReact,
        process: processBrowserPath,
        'process/browser.js': processBrowserPath,
        buffer: bufferPath,
        '!style-loader!css-loader!react-quill/dist/quill.snow.css': quillCssPath,
      }, options.aliases || {}),
      dedupe: ['react', 'react-dom'],
    },
    css: {
      modules: {
        scopeBehaviour: 'local',
        generateScopedName: '[local]---[hash:base64:5]',
        globalModulePaths: [
          /global\.css$/,
          /variables\.css$/,
          /fonts\.css$/,
          /normalize\.css$/,
          /quill\.snow\.css$/,
          /dist\/style\.css$/,
        ],
      },
      postcss: require(path.join(__dirname, '..', 'postcss.config.js')), // eslint-disable-line global-require, import/no-dynamic-require
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || (command === 'serve' ? 'development' : 'production')),
      global: 'globalThis',
    },
    optimizeDeps: {
      include: [
        'classnames',
        'dayjs',
        ...dayjsInteropModules,
        'hoist-non-react-statics',
        'inactivity-timer',
        'invariant',
        'is-promise',
        'lodash',
        'lodash.debounce',
        ...lodashInteropModules,
        'localforage',
        'ms',
        'moment-range',
        'moment-timezone',
        'path-to-regexp',
        ...propTypesExtraInteropModules,
        'query-string',
        'react-highlight-words',
        'react-intl',
        'react-is',
        'react-quill',
        'react-dom/client',
        'react-redux',
        'rtl-detect',
        ...semverInteropModules,
        'prop-types',
      ],
      exclude: [
        '@folio/stripes-core',
        '@folio/stripes-components',
        '@folio/stripes-connect',
        '@folio/stripes-smart-components',
        '@folio/stripes-ui',
        '@folio/users',
      ],
      needsInterop: [
        'classnames',
        'dayjs',
        ...dayjsInteropModules,
        'hoist-non-react-statics',
        'inactivity-timer',
        'invariant',
        'is-promise',
        'lodash',
        'lodash.debounce',
        ...lodashInteropModules,
        'localforage',
        'ms',
        'moment-range',
        'moment-timezone',
        'path-to-regexp',
        ...propTypesExtraInteropModules,
        'query-string',
        'react-highlight-words',
        'react-is',
        'react-quill',
        'react-dom/client',
        'rtl-detect',
        ...semverInteropModules,
      ],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
        define: {
          global: 'globalThis',
        },
      },
    },
    esbuild: {
      loader: 'jsx',
      include: /.*\.[jt]sx?$/,
      exclude: [],
    },
    build: {
      outDir: path.resolve(options.outputPath || './output'),
      emptyOutDir: true,
      sourcemap: !!options.sourcemap,
      minify: options.minify === false ? false : 'esbuild',
      commonjsOptions: {
        exclude: [/node_modules\/@folio\//],
      },
    },
    server: {
      host: options.host || process.env.STRIPES_HOST || 'localhost',
      port: Number(options.port || process.env.STRIPES_PORT || 3000),
      strictPort: true,
    },
  };
}

function createBuildStats(result) {
  const outputs = Array.isArray(result) ? result : [result];
  const files = outputs.flatMap((output) => (output.output || []).map((item) => item.fileName)).join('\n');

  return {
    hasErrors() {
      return false;
    },
    toString() {
      return files ? `Vite build completed.\n${files}` : 'Vite build completed.';
    },
  };
}

module.exports = {
  createBuildStats,
  findLocalOrCoreModule,
  getViteConfig,
  loadProjectModule,
};

const fs = require('fs');
const webpack = require('webpack');

const StripesConfigPlugin = require('./stripes-config-plugin');
const modulePaths = require('./module-paths');
const StripesTranslationsPlugin = require('./stripes-translations-plugin');

// Stub the parts of the webpack compiler that the StripesTranslationsPlugin interacts with
const compilerStub = {
  apply: () => { },
  plugin: () => { },
  options: {
    output: {
      publicPath: '/',
    },
    resolve: {
      aliases: {},
    },
  },
  hooks: {
    beforeWrite: {
      tap: () => { },
    },
    emit: {
      tapAsync: () => { },
    },
    processAssets: {
      tap: () => { },
    },
    thisCompilation: {
      tap: () => { },
    },
    contextModuleFactory: {
      tap: () => { },
    },
    afterResolve: {
      tap: () => { },
    }
  }
};

describe('The stripes-translations-plugin', () => {
  let stripesConfig;

  beforeEach(() => {
    stripesConfig = {
      config: {},
      modules: {
        '@folio/users': {},
        '@folio/inventory': {},
        '@folio/items': {},
        '@folio/checkout': {},
      },
    };
  });

  describe('constructor', () => {
    it('includes stripes-core with modules for translation', () => {
      const sut = new StripesTranslationsPlugin(stripesConfig);
      expect(sut.modules).toEqual(expect.any(Object));
      expect(sut.modules).toHaveProperty('@folio/stripes-core');
      expect(sut.modules).toEqual(expect.objectContaining(stripesConfig.modules));
    });

    it('assigns language filter', () => {
      stripesConfig.config.languages = ['en'];
      const sut = new StripesTranslationsPlugin(stripesConfig);
      expect(sut.languageFilter).toEqual(expect.any(Array));
      expect(sut.languageFilter).toContain('en');
    });
  });

  describe('apply method', () => {
    let locateStub;
    let existsSyncStub;
    let readdirSyncStub;
    let applyStub;
    let tapAsyncStub;
    let tapStub;
    let loadFileStub;
    let compilationStub;
    let processAssetsStub;

    beforeEach(() => {
      locateStub = jest.spyOn(modulePaths, 'locateStripesModule')
        .mockImplementation((context, mod) => `path/to/${mod}/package.json`);
      existsSyncStub = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      readdirSyncStub = jest.spyOn(fs, 'readdirSync').mockReturnValue([
        {
          isFile: () => true,
          name: 'en.json',
        },
        {
          isFile: () => true,
          name: 'es.json',
        },
        {
          isFile: () => true,
          name: 'fr.json',
        },
      ]);
      applyStub = jest.spyOn(webpack.ContextReplacementPlugin.prototype, 'apply');
      tapAsyncStub = jest.spyOn(compilerStub.hooks.emit, 'tapAsync');
      tapStub = jest.spyOn(compilerStub.hooks.thisCompilation, 'tap');
      loadFileStub = jest.spyOn(StripesTranslationsPlugin, 'loadFile')
        .mockReturnValue({ key1: 'Value 1', key2: 'Value 2' });
      compilationStub = {
        assets: {},
        hooks: {
          processAssets: {
            tap: jest.fn()
          },
        },
      };
      processAssetsStub = jest.spyOn(compilationStub.hooks.processAssets, 'tap');

      StripesConfigPlugin.getPluginHooks(compilerStub).beforeWrite.tap(
        { name: 'StripesConfigPlugin', context: true },
        context => Object.assign(context, {
          stripesDeps: {
            'stripes-dependency': [{
              name: 'stripes-dependency',
              resolvedPath: '.'
            }]
          }
        })
      );

      StripesConfigPlugin.getPluginHooks(compilerStub).beforeWrite.call({});
    });

    afterEach(() => {
      locateStub.mockRestore();
      existsSyncStub.mockRestore();
      readdirSyncStub.mockRestore();
      applyStub.mockRestore();
      tapAsyncStub.mockRestore();
      tapStub.mockRestore();
      loadFileStub.mockRestore();
      processAssetsStub.mockRestore();
    });

    it('registers the "emit" hook', () => {
      const sut = new StripesTranslationsPlugin(stripesConfig);
      sut.apply(compilerStub);
      StripesConfigPlugin.getPluginHooks(compilerStub).beforeWrite.call({});

      expect(tapStub).toHaveBeenCalledWith('StripesTranslationsPlugin', expect.any(Function));
    });

    it('includes modules from nominated dependencies', () => {
      const sut = new StripesTranslationsPlugin(stripesConfig);
      sut.apply(compilerStub);
      StripesConfigPlugin.getPluginHooks(compilerStub).beforeWrite.call({});

      expect(sut.modules).toEqual(expect.any(Object));
      expect(sut.modules).toHaveProperty('stripes-dependency');
    });

    it('generates an emit function with all translations', () => {
      const sut = new StripesTranslationsPlugin(stripesConfig);
      sut.apply(compilerStub);
      StripesConfigPlugin.getPluginHooks(compilerStub).beforeWrite.call({});

      // Get the callback passed to 'thisCompilation' hook
      const pluginArgs = tapStub.mock.calls[0];
      const compilerCallback = pluginArgs[1];

      compilerCallback(compilationStub);

      const compilationArgs = processAssetsStub.mock.calls[0];
      const compilationCallback = compilationArgs[1];

      // Call it and observe the modification to compilation.asset
      compilationCallback();

      const emitFiles = Object.keys(compilationStub.assets);

      expect(emitFiles).toHaveLength(3);
      expect(emitFiles.some(file => /translations\/en-\d+\.json/.test(file))).toBe(true);
      expect(emitFiles.some(file => /translations\/es-\d+\.json/.test(file))).toBe(true);
      expect(emitFiles.some(file => /translations\/fr-\d+\.json/.test(file))).toBe(true);
    });

    it('applies ContextReplacementPlugins when language filters are set', () => {
      const sut = new StripesTranslationsPlugin(stripesConfig);
      sut.languageFilter = ['en'];
      sut.apply(compilerStub);

      expect(applyStub).toHaveBeenCalledTimes(2);
      expect(applyStub).toHaveBeenCalledWith(compilerStub);
    });
  });

  describe('gatherAllTranslations method', () => {
    let locateStub;
    let sut;
    let loadTranslationsDirectoryStub;
    let loadTranslationsPackageJsonStub;

    beforeEach(() => {
      locateStub = jest.spyOn(modulePaths, 'locateStripesModule')
        .mockImplementation((context, mod) => `path/to/${mod}/package.json`);
      sut = new StripesTranslationsPlugin(stripesConfig);
      loadTranslationsDirectoryStub = jest.spyOn(sut, 'loadTranslationsDirectory').mockReturnValue({});
      loadTranslationsPackageJsonStub = jest.spyOn(sut, 'loadTranslationsPackageJson').mockReturnValue({});
    });

    afterEach(() => {
      locateStub.mockRestore();
      loadTranslationsDirectoryStub.mockRestore();
      loadTranslationsPackageJsonStub.mockRestore();
    });

    it('uses the translation directory when it exists', () => {
      const existsSyncStub = jest.spyOn(fs, 'existsSync').mockReturnValue(true); // translation dir exists
      sut.gatherAllTranslations();
      expect(loadTranslationsDirectoryStub).toHaveBeenCalled();
      expect(loadTranslationsPackageJsonStub).not.toHaveBeenCalled();
      existsSyncStub.mockRestore();
    });

    it('uses package.json when translations directory does not exist', () => {
      const existsSyncStub = jest.spyOn(fs, 'existsSync').mockReturnValue(false); // translation dir does not exist
      sut.gatherAllTranslations();
      expect(loadTranslationsDirectoryStub).not.toHaveBeenCalled();
      expect(loadTranslationsPackageJsonStub).toHaveBeenCalled();
      existsSyncStub.mockRestore();
    });
  });

  describe('loadTranslationsDirectory method', () => {
    let readdirSyncStub;
    let loadFileStub;
    let sut;

    beforeEach(() => {
      readdirSyncStub = jest.spyOn(fs, 'readdirSync').mockReturnValue([
        {
          isFile: () => true,
          name: 'en.json',
        },
        {
          isFile: () => true,
          name: 'es.json',
        },
        {
          isFile: () => true,
          name: 'fr.json',
        },
      ]);
      loadFileStub = jest.spyOn(StripesTranslationsPlugin, 'loadFile')
        .mockReturnValue({ key1: 'Value 1', key2: 'Value 2' });
      sut = new StripesTranslationsPlugin(stripesConfig);
    });

    afterEach(() => {
      readdirSyncStub.mockRestore();
      loadFileStub.mockRestore();
    });

    it('loads all translations from the translation directory', () => {
      const result = sut.loadTranslationsDirectory('@folio/my-app', 'path/to/translations');
      expect(loadFileStub).toHaveBeenCalledTimes(3);
      expect(result).toEqual(expect.any(Object));
      expect(Object.keys(result)).toEqual(expect.arrayContaining(['en', 'fr', 'es']));
    });

    it('loads only filtered translations from the translation directory', () => {
      sut.languageFilter = ['en'];
      const result = sut.loadTranslationsDirectory('@folio/my-app', 'path/to/translations');
      expect(loadFileStub).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.any(Object));
      expect(Object.keys(result)).toEqual(['en']);
      expect(Object.keys(result)).not.toEqual(expect.arrayContaining(['fr', 'es']));
    });
  });

  describe('loadTranslationsPackageJson method', () => {
    let loadFileStub;
    let sut;

    beforeEach(() => {
      loadFileStub = jest.spyOn(StripesTranslationsPlugin, 'loadFile').mockReturnValue({
        stripes: {
          translations: {
            en: { key1: 'Value 1', key2: 'Value 2' },
            es: { key1: 'Value 1', key2: 'Value 2' },
            fr: { key1: 'Value 1', key2: 'Value 2' },
          },
        },
      });
      sut = new StripesTranslationsPlugin(stripesConfig);
    });

    afterEach(() => {
      loadFileStub.mockRestore();
    });

    it('loads all translations from package.json', () => {
      const result = sut.loadTranslationsPackageJson('@folio/my-app', 'path/to/package.json');
      expect(result).toEqual(expect.any(Object));
      expect(Object.keys(result)).toEqual(expect.arrayContaining(['en', 'fr', 'es']));
    });

    it('loads only filtered translations from package.json', () => {
      sut.languageFilter = ['en'];
      const result = sut.loadTranslationsPackageJson('@folio/my-app', 'path/to/translations');
      expect(result).toEqual(expect.any(Object));
      expect(Object.keys(result)).toEqual(['en']);
      expect(Object.keys(result)).not.toEqual(expect.arrayContaining(['fr', 'es']));
    });
  });

  describe('getModuleName method', () => {
    it('applies "ui-" prefix to module keys', () => {
      const result = StripesTranslationsPlugin.getModuleName('@folio/my-app');
      expect(result).toEqual(expect.any(String));
      expect(result).toBe('ui-my-app');
    });

    it('does not apply "ui-" prefix to stripes-core keys', () => {
      const result = StripesTranslationsPlugin.getModuleName('@folio/stripes-core');
      expect(result).toEqual(expect.any(String));
      expect(result).toBe('stripes-core');
    });
  });

  describe('prefixModuleKeys method', () => {
    it('applies "ui-" prefix to module keys', () => {
      const translations = { key1: 'Value 1', key2: 'Value 2', key3: 'Value 3' };
      const result = StripesTranslationsPlugin.prefixModuleKeys('@folio/my-app', translations);
      expect(result).toEqual(expect.any(Object));
      expect(Object.keys(result)).toEqual(expect.arrayContaining(['ui-my-app.key1', 'ui-my-app.key2', 'ui-my-app.key3']));
    });

    it('does not apply "ui-" prefix to stripes-core keys', () => {
      const translations = { key1: 'Value 1', key2: 'Value 2', key3: 'Value 3' };
      const result = StripesTranslationsPlugin.prefixModuleKeys('@folio/stripes-core', translations);
      expect(result).toEqual(expect.any(Object));
      expect(Object.keys(result)).toEqual(expect.arrayContaining(['stripes-core.key1', 'stripes-core.key2', 'stripes-core.key3']));
    });
  });

  describe('generateFileNames method', () => {
    let sut;

    beforeEach(() => {
      sut = new StripesTranslationsPlugin(stripesConfig);
    });

    it('returns paths for emit hook and browser fetch', () => {
      const translations = {
        en: { key1: 'Value 1', key2: 'Value 2' },
      };
      sut.publicPath = '/';
      const result = sut.generateFileNames(translations);
      expect(result).toEqual(expect.any(Object));
      expect(result).toHaveProperty('en');
      expect(result.en).toHaveProperty('browserPath');
      expect(result.en.browserPath).toMatch(/^\/translations\/en-\d+\.json/);
      expect(result.en).toHaveProperty('emitPath');
      expect(result.en.emitPath).toMatch(/^translations\/en-\d+\.json/);
    });

    it('applies publicPath', () => {
      const translations = {
        en: { key1: 'Value 1', key2: 'Value 2' },
      };
      sut.publicPath = '/my-public-path/';
      const result = sut.generateFileNames(translations);
      expect(result).toEqual(expect.any(Object));
      expect(result).toHaveProperty('en');
      expect(result.en).toHaveProperty('browserPath');
      expect(result.en.browserPath).toMatch(/^\/my-public-path\/translations\/en-\d+\.json/);
      expect(result.en).toHaveProperty('emitPath');
      expect(result.en.emitPath).toMatch(/^translations\/en-\d+\.json/);
    });
  });
});

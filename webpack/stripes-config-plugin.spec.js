const VirtualModulesPlugin = require('webpack-virtual-modules');
const StripesConfigPlugin = require('./stripes-config-plugin');
const StripesTranslationsPlugin = require('./stripes-translations-plugin');
const StripesBrandingPlugin = require('./stripes-branding-plugin');
const StripesErrorLoggingPlugin = require('./stripes-error-logging-plugin');
const stripesModuleParser = require('./stripes-module-parser');
const stripesSerialize = require('./stripes-serialize');

const compilerStub = {
  apply: () => { },
  plugin: () => { },
  options: {
    resolve: {
      alias: {
        'my-alias': '/path/to/some-module',
      },
    },
    plugins: [],
  },
  hooks: {
    afterPlugins: {
      tap: () => { },
    },
    emit: {
      tapAsync: () => { },
    },
    afterEnvironment: {
      tap: () => { }
    },
    afterResolvers: {
      tap: () => { }
    },
    watchRun: {
      tapAsync: () => { }
    },
  },
  context: '/context/path',
  warnings: [],
};

const mockConfig = {
  modules: {
    '@folio/users': {},
    '@folio/search': {},
    '@folio/developer': {},
  },
};

describe('The stripes-config-plugin', () => {
  describe('constructor', () => {
    it('throws StripesBuildError when missing modules config', () => {
      expect(() => {
        new StripesConfigPlugin({});
      }).toThrow(/was not provided a "modules" object/);
    });

    it('omits branding config (handled by its own plugin)', () => {
      const config = {
        modules: {},
        branding: {},
      };
      const sut = new StripesConfigPlugin(config);
      expect(sut.options).toHaveProperty('modules');
      expect(sut.options).not.toHaveProperty('branding');
    });
  });

  describe('apply method', () => {
    let parseAllModulesStub;
    let sut;

    beforeEach(() => {
      parseAllModulesStub = jest.spyOn(stripesModuleParser, 'parseAllModules').mockReturnValue({ app: ['something'] });
      sut = new StripesConfigPlugin(mockConfig);
    });

    afterEach(() => {
      parseAllModulesStub.mockRestore();
      delete compilerStub.hooks.stripesConfigPluginBeforeWrite;
    });

    it('applies a virtual module', () => {
      const spy = jest.spyOn(VirtualModulesPlugin.prototype, 'apply');
      sut.apply(compilerStub);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(compilerStub);
      spy.mockRestore();
    });

    it('registers the "after-plugins" hook', () => {
      const spy = jest.spyOn(compilerStub.hooks.afterPlugins, 'tap');
      sut.apply(compilerStub);
      expect(spy).toHaveBeenCalledWith('StripesConfigPlugin', expect.any(Function));
      spy.mockRestore();
    });
  });

  describe('afterPlugins method', () => {
    let parseAllModulesStub;
    let serializeStub;
    let sut;

    beforeEach(() => {
      parseAllModulesStub = jest.spyOn(stripesModuleParser, 'parseAllModules')
        .mockReturnValue({
          config: 'something',
          metadata: 'something',
          lazyImports: {}
        });
      serializeStub = jest.spyOn(stripesSerialize, 'serializeWithRequire')
        .mockReturnValue('module.exports = {};');
      sut = new StripesConfigPlugin(mockConfig);

      compilerStub.plugins = [];

      const translationPlugin = new StripesTranslationsPlugin({ config: {} });
      translationPlugin.allFiles = { en: '/translations/stripes-core/en.json' };
      compilerStub.options.plugins.push(translationPlugin);

      const brandingPlugin = new StripesBrandingPlugin({});
      brandingPlugin.serializedBranding = JSON.stringify({ logo: { alt: 'Future Of Libraries Is Open' } });
      compilerStub.options.plugins.push(brandingPlugin);

      const loggingPlugin = new StripesErrorLoggingPlugin({});
      loggingPlugin.errorLogging = JSON.stringify({ loggingService: { apiKey: 'top-secret' } });
      compilerStub.options.plugins.push(loggingPlugin);

      sut.apply(compilerStub);
    });

    afterEach(() => {
      parseAllModulesStub.mockRestore();
      serializeStub.mockRestore();
      delete compilerStub.hooks.stripesConfigPluginBeforeWrite;
    });

    it('initializes with required dependencies', () => {
      expect(sut).toBeDefined();
      expect(sut.options).toBeDefined();
      expect(sut.virtualModule).toBeDefined();
    });
  });

  describe('processWarnings method', () => {
    let sut;

    beforeEach(() => {
      compilerStub.warnings = [];
      sut = new StripesConfigPlugin(mockConfig);
    });

    it('assigns warnings to the Webpack compilation', () => {
      sut.warnings = ['uh-oh', 'something happened'];
      sut.processWarnings(compilerStub, () => { });
      expect(compilerStub.warnings).toEqual(expect.any(Array));
      expect(compilerStub.warnings).toHaveLength(1);
      expect(compilerStub.warnings[0].toString()).toMatch(/uh-oh/);
      expect(compilerStub.warnings[0].toString()).toMatch(/something happened/);
    });

    it('does not assign warnings when not present', () => {
      sut.warnings = [];
      sut.processWarnings(compilerStub, () => { });
      expect(compilerStub.warnings).toEqual(expect.any(Array));
      expect(compilerStub.warnings).toHaveLength(0);
    });
  });
});

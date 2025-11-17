const StripesWebpackPlugin = require('./stripes-webpack-plugin');
const StripesConfigPlugin = require('./stripes-config-plugin');
const StripesTranslationsPlugin = require('./stripes-translations-plugin');
const StripesBrandingPlugin = require('./stripes-branding-plugin');
const StripesErrorLoggingPlugin = require('./stripes-error-logging-plugin');
const StripesDuplicatesPlugin = require('./stripes-duplicate-plugin');

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
    }
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
  config: {},
};

describe('The stripes-webpack-plugin', () => {
  describe('apply method', () => {
    let spies;

    beforeEach(() => {
      spies = {
        StripesConfigPlugin: jest.spyOn(StripesConfigPlugin.prototype, 'apply').mockImplementation(() => { }),
        StripesBrandingPlugin: jest.spyOn(StripesBrandingPlugin.prototype, 'apply').mockImplementation(() => { }),
        StripesErrorLoggingPlugin: jest.spyOn(StripesErrorLoggingPlugin.prototype, 'apply').mockImplementation(() => { }),
        StripesTranslationsPlugin: jest.spyOn(StripesTranslationsPlugin.prototype, 'apply').mockImplementation(() => { }),
        StripesDuplicatesPlugin: jest.spyOn(StripesDuplicatesPlugin.prototype, 'apply').mockImplementation(() => { }),
      };
    });

    afterEach(() => {
      Object.values(spies).forEach(spy => spy.mockRestore());
      delete compilerStub.hooks.stripesConfigPluginBeforeWrite;
    });

    it('applies StripesConfigPlugin', () => {
      const sut = new StripesWebpackPlugin({ stripesConfig: mockConfig });
      sut.apply(compilerStub);
      expect(spies.StripesConfigPlugin).toHaveBeenCalledTimes(1);
      expect(spies.StripesConfigPlugin).toHaveBeenCalledWith(compilerStub);
    });

    it('applies StripesBrandingPlugin', () => {
      const sut = new StripesWebpackPlugin({ stripesConfig: mockConfig });
      sut.apply(compilerStub);
      expect(spies.StripesBrandingPlugin).toHaveBeenCalledTimes(1);
      expect(spies.StripesBrandingPlugin).toHaveBeenCalledWith(compilerStub);
    });

    it('applies StripesErrorLoggingPlugin', () => {
      const sut = new StripesWebpackPlugin({ stripesConfig: mockConfig });
      sut.apply(compilerStub);
      expect(spies.StripesErrorLoggingPlugin).toHaveBeenCalledTimes(1);
      expect(spies.StripesErrorLoggingPlugin).toHaveBeenCalledWith(compilerStub);
    });

    it('applies StripesTranslationsPlugin', () => {
      const sut = new StripesWebpackPlugin({ stripesConfig: mockConfig });
      sut.apply(compilerStub);
      expect(spies.StripesTranslationsPlugin).toHaveBeenCalledTimes(1);
      expect(spies.StripesTranslationsPlugin).toHaveBeenCalledWith(compilerStub);
    });

    it('applies StripesDuplicatesPlugin', () => {
      const sut = new StripesWebpackPlugin({ stripesConfig: mockConfig });
      sut.apply(compilerStub);
      expect(spies.StripesDuplicatesPlugin).toHaveBeenCalledTimes(1);
      expect(spies.StripesDuplicatesPlugin).toHaveBeenCalledWith(compilerStub);
    });
  });
});

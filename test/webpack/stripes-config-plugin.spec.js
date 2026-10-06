import { jest } from '@jest/globals';
import { expect } from 'chai';
import sinon from 'sinon';

import VirtualModulesPlugin from 'webpack-virtual-modules';

// The plugin imports these as ES namespaces, which cannot be stubbed; mock the modules.
const parseAllModules = jest.fn();
const serializeWithRequire = jest.fn();
jest.unstable_mockModule('../../webpack/stripes-module-parser.js', () => ({ parseAllModules }));
jest.unstable_mockModule('../../webpack/stripes-serialize.js', () => ({ serializeWithRequire }));
const { default: StripesConfigPlugin } = await import('../../webpack/stripes-config-plugin.js');
const { default: StripesTranslationsPlugin } = await import('../../webpack/stripes-translations-plugin.js');
const { default: StripesBrandingPlugin } = await import('../../webpack/stripes-branding-plugin.js');
const { default: StripesErrorLoggingPlugin } = await import('../../webpack/stripes-error-logging-plugin.js');

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
  config: {},
};

describe('The stripes-config-plugin', function () {
  describe('constructor', function () {
    it('throws StripesBuildError when missing modules config', function () {
      const config = {};
      try {
        const sut = new StripesConfigPlugin(config); // eslint-disable-line no-unused-vars
        expect('should not get here').to.equal(false);
      } catch (err) {
        expect(err.message).match(/was not provided a "modules" object/);
      }
    });

    it('omits branding config (handled by its own plugin)', function () {
      const config = {
        modules: {},
        branding: {},
      };
      const sut = new StripesConfigPlugin(config);
      expect(sut.options).to.have.property('modules');
      expect(sut.options).to.not.have.property('branding');
    });
  });

  describe('apply method', function () {
    let sut;

    beforeEach(function () {
      parseAllModules.mockReset();
      parseAllModules.mockReturnValue({ app: ['something'] });
      sut = new StripesConfigPlugin(mockConfig);
    });

    afterEach(function () {
      delete compilerStub.hooks.stripesConfigPluginBeforeWrite;
    });

    it('applies a virtual module', function () {
      sinon.spy(VirtualModulesPlugin.prototype, 'apply');
      sut.apply(compilerStub);

      expect(VirtualModulesPlugin.prototype.apply).to.have.been.calledOnce;
      expect(VirtualModulesPlugin.prototype.apply).to.be.calledWith(compilerStub);
    });

    it('registers the "after-plugins" hook', function () {
      sinon.spy(compilerStub.hooks.afterPlugins, 'tap');
      sut.apply(compilerStub);
      expect(compilerStub.hooks.afterPlugins.tap).to.have.been.calledWith('StripesConfigPlugin');
    });
  });

  describe('afterPlugins method', function () {
    let sut;

    beforeEach(function () {
      parseAllModules.mockReset();
      parseAllModules.mockReturnValue({ config: 'something', metadata: 'something', lazyImports: {} });
      sinon.stub(VirtualModulesPlugin.prototype, 'writeModule').returns({});
      serializeWithRequire.mockReset();
      serializeWithRequire.mockReturnValue({});
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

    afterEach(function () {
      delete compilerStub.hooks.stripesConfigPluginBeforeWrite;
    });

    it('calls virtualModule.writeModule()', function () {
      sut.afterPlugins(compilerStub);
      expect(sut.virtualModule.writeModule).to.have.been.calledOnce;
    });

    it('writes serialized config to virtual module', function () {
      sut.afterPlugins(compilerStub);
      const writeModuleArgs = sut.virtualModule.writeModule.getCall(0).args;
      expect(writeModuleArgs[0]).to.be.a('string').that.equals('node_modules/stripes-config.js');

      // TODO: More thorough analysis of the generated virtual module
      expect(writeModuleArgs[1]).to.be.a('string').with.match(/export { branding, config, errorLogging, icons, metadata, modules, okapi, translations }/);
    });
  });

  describe('processWarnings method', function () {
    let sut;

    beforeEach(function () {
      compilerStub.warnings = [];
      sut = new StripesConfigPlugin(mockConfig);
    });

    it('assigns warnings to the Webpack compilation', function () {
      sut.warnings = ['uh-oh', 'something happened'];
      sut.processWarnings(compilerStub, () => { });
      expect(compilerStub.warnings).to.be.an('array').with.length(1);
      expect(compilerStub.warnings[0]).to.match(/uh-oh/);
      expect(compilerStub.warnings[0]).to.match(/something happened/);
    });

    it('does not assign warnings when not present', function () {
      sut.warnings = [];
      sut.processWarnings(compilerStub, () => { });
      expect(compilerStub.warnings).to.be.an('array').with.length(0);
    });
  });
});

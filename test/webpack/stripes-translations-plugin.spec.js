import { expect } from 'chai';
import fs from 'fs';
import sinon from 'sinon';
import webpack from 'webpack';
import { jest } from '@jest/globals';

import * as actualModulePaths from '../../webpack/module-paths.js';

// ESM namespaces can't be stubbed, so replace module-paths with a mutable wrapper
const modulePaths = { locateStripesModule: actualModulePaths.locateStripesModule };
jest.unstable_mockModule('../../webpack/module-paths.js', () => ({
  ...actualModulePaths,
  locateStripesModule: (...a) => modulePaths.locateStripesModule(...a),
}));
const { default: StripesConfigPlugin } = await import('../../webpack/stripes-config-plugin.js');
const { default: StripesTranslationsPlugin } = await import('../../webpack/stripes-translations-plugin.js');

let stripesConfig;
let stripesFederateConfig;
let compilationStub;
let sut;

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

    stripesFederateConfig = { ...stripesConfig, federate: true };
  });

  describe('constructor', () => {
    it('includes stripes-core with modules for translation', () => {
      const sut = new StripesTranslationsPlugin(stripesConfig);
      expect(sut.modules).to.be.an('object').with.property('@folio/stripes-core');
      expect(sut.modules).to.deep.include(stripesConfig.modules);
    });

    it('assigns language filter', () => {
      stripesConfig.config.languages = ['en'];
      const sut = new StripesTranslationsPlugin(stripesConfig);
      expect(sut.languageFilter).to.be.an('array').and.include('en');
    });
  });

  describe('apply method', () => {
    beforeEach(() => {
      modulePaths.locateStripesModule = (context, mod) => `path/to/${mod}/package.json`;
      sinon.stub(fs, 'existsSync').returns(true);
      sinon.stub(fs, 'readdirSync').returns([
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
      sinon.spy(webpack.ContextReplacementPlugin.prototype, 'apply');
      sinon.spy(compilerStub.hooks.emit, 'tapAsync');
      sinon.spy(compilerStub.hooks.thisCompilation, 'tap');
      sinon.stub(StripesTranslationsPlugin, 'loadFile').returns({ key1: 'Value 1', key2: 'Value 2', name: 'testPackage', stripes: { stripesDeps: ['stripes-federate-dependency'] } });
      compilationStub = {
        assets: {},
        hooks: {
          processAssets: {
            tap: () => { }
          },
        },
      };
      sinon.spy(compilationStub.hooks.processAssets, 'tap');

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

    it('registers the "emit" hook', () => {
      sut = new StripesTranslationsPlugin(stripesConfig);
      sut.apply(compilerStub);
      StripesConfigPlugin.getPluginHooks(compilerStub).beforeWrite.call({});

      expect(compilerStub.hooks.thisCompilation.tap).to.be.calledWith('StripesTranslationsPlugin');
    });

    it('includes modules from nominated dependencies', () => {
      sut = new StripesTranslationsPlugin(stripesConfig);
      sut.apply(compilerStub);
      StripesConfigPlugin.getPluginHooks(compilerStub).beforeWrite.call({});

      expect(sut.modules).to.be.an('object').with.property('stripes-dependency');
    });

    it('includes certain modules and stripes-deps in "federate" mpode', () => {
      // federate mode is per-module, so the plugin executes outside of StripesConfigPlugin, with its own hook.
      sut = new StripesTranslationsPlugin(stripesFederateConfig);
      sut.apply({ ...compilerStub, context: import.meta.dirname });

      expect(sut.modules).to.be.an('object').with.property('testPackage');
      expect(sut.modules).to.be.an('object').with.property('stripes-federate-dependency');
    });

    it('generates an emit function with all translations', () => {
      sut = new StripesTranslationsPlugin(stripesConfig);
      sut.apply(compilerStub);
      StripesConfigPlugin.getPluginHooks(compilerStub).beforeWrite.call({});

      // Get the callback passed to 'thisCompilation' hook
      const pluginArgs = compilerStub.hooks.thisCompilation.tap.getCall(0).args;
      const compilerCallback = pluginArgs[1];

      compilerCallback(compilationStub);

      const compilationArgs = compilationStub.hooks.processAssets.tap.getCall(0).args;
      const compilationCallback = compilationArgs[1];

      // Call it and observe the modification to compilation.asset
      compilationCallback();

      const emitFiles = Object.keys(compilationStub.assets);

      expect(emitFiles).to.have.length(3);
      expect(emitFiles).to.match(/translations\/en-\d+\.json/);
      expect(emitFiles).to.match(/translations\/es-\d+\.json/);
      expect(emitFiles).to.match(/translations\/fr-\d+\.json/);
    });

    it('generates an emit function with all translations (federate mode)', () => {
      sut = new StripesTranslationsPlugin(stripesFederateConfig);
      sut.apply({ ...compilerStub, context: import.meta.dirname });

      // Get the callback passed to 'thisCompilation' hook
      const pluginArgs = compilerStub.hooks.thisCompilation.tap.getCall(0).args;
      const compilerCallback = pluginArgs[1];

      compilerCallback(compilationStub);

      const compilationArgs = compilationStub.hooks.processAssets.tap.getCall(0).args;
      const compilationCallback = compilationArgs[1];

      // Call it and observe the modification to compilation.asset
      compilationCallback();

      const emitFiles = Object.keys(compilationStub.assets);

      expect(emitFiles).to.have.length(3);
      expect(emitFiles).to.match(/translations\/en-\d+\.json/);
      expect(emitFiles).to.match(/translations\/es-\d+\.json/);
      expect(emitFiles).to.match(/translations\/fr-\d+\.json/);
    });

    it('applies ContextReplacementPlugins when language filters are set', () => {
      sut = new StripesTranslationsPlugin(stripesConfig);
      sut.languageFilter = ['en'];
      sut.apply(compilerStub);

      expect(webpack.ContextReplacementPlugin.prototype.apply).to.have.been.calledTwice;
      expect(webpack.ContextReplacementPlugin.prototype.apply).to.be.calledWith(compilerStub);
    });
  });

  describe('gatherAllTranslations method', () => {
    beforeEach(() => {
      modulePaths.locateStripesModule = (context, mod) => `path/to/${mod}/package.json`;
      sut = new StripesTranslationsPlugin(stripesConfig);
      sinon.stub(sut, 'loadTranslationsDirectory').returns({});
      sinon.stub(sut, 'loadTranslationsPackageJson').returns({});
    });

    it('uses the translation directory when it exists', () => {
      sinon.stub(fs, 'existsSync').returns(true); // translation dir exists
      sut.gatherAllTranslations();
      expect(sut.loadTranslationsDirectory).to.have.been.called;
      expect(sut.loadTranslationsPackageJson).not.to.have.been.called;
    });

    it('uses package.json when translations directory does not exist', () => {
      sinon.stub(fs, 'existsSync').returns(false); // translation dir does not exist
      sut.gatherAllTranslations();
      expect(sut.loadTranslationsDirectory).not.to.have.been.called;
      expect(sut.loadTranslationsPackageJson).to.have.been.called;
    });
  });

  describe('loadTranslationsDirectory method', () => {
    beforeEach(() => {
      sinon.stub(fs, 'readdirSync').returns([
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
      sinon.stub(StripesTranslationsPlugin, 'loadFile').returns({ key1: 'Value 1', key2: 'Value 2' });
      sut = new StripesTranslationsPlugin(stripesConfig);
    });

    it('loads all translations from the translation directory', () => {
      const result = sut.loadTranslationsDirectory('@folio/my-app', 'path/to/translations');
      expect(StripesTranslationsPlugin.loadFile).to.have.callCount(3);
      expect(result).to.be.an('object').with.all.keys('en', 'fr', 'es');
    });

    it('loads only filtered translations from the translation directory', () => {
      sut.languageFilter = ['en'];
      const result = sut.loadTranslationsDirectory('@folio/my-app', 'path/to/translations');
      expect(StripesTranslationsPlugin.loadFile).to.have.been.calledOnce;
      expect(result).to.be.an('object').with.all.keys('en').and.not.any.keys('fr', 'es');
    });
  });

  describe('loadTranslationsPackageJson method', () => {
    beforeEach(() => {
      sinon.stub(StripesTranslationsPlugin, 'loadFile').returns({
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

    it('loads all translations from package.json', () => {
      const result = sut.loadTranslationsPackageJson('@folio/my-app', 'path/to/package.json');
      expect(result).to.be.an('object').with.all.keys('en', 'fr', 'es');
    });

    it('loads only filtered translations from package.json', () => {
      sut.languageFilter = ['en'];
      const result = sut.loadTranslationsPackageJson('@folio/my-app', 'path/to/translations');
      expect(result).to.be.an('object').with.all.keys('en').and.not.any.keys('fr', 'es');
    });
  });

  describe('getModuleName method', () => {
    it('applies "ui-" prefix to module keys', () => {
      const result = StripesTranslationsPlugin.getModuleName('@folio/my-app');
      expect(result).to.be.a('string').to.equal('ui-my-app');
    });

    it('does not apply "ui-" prefix to stripes-core keys', () => {
      const result = StripesTranslationsPlugin.getModuleName('@folio/stripes-core');
      expect(result).to.be.a('string').to.equal('stripes-core');
    });
  });

  describe('prefixModuleKeys method', () => {
    it('applies "ui-" prefix to module keys', () => {
      const translations = { key1: 'Value 1', key2: 'Value 2', key3: 'Value 3' };
      const result = StripesTranslationsPlugin.prefixModuleKeys('@folio/my-app', translations);
      expect(result).to.be.an('object').with.all.keys('ui-my-app.key1', 'ui-my-app.key2', 'ui-my-app.key3');
    });

    it('does not apply "ui-" prefix to stripes-core keys', () => {
      const translations = { key1: 'Value 1', key2: 'Value 2', key3: 'Value 3' };
      const result = StripesTranslationsPlugin.prefixModuleKeys('@folio/stripes-core', translations);
      expect(result).to.be.an('object').with.all.keys('stripes-core.key1', 'stripes-core.key2', 'stripes-core.key3');
    });
  });

  describe('generateFileNames method', () => {
    beforeEach(() => {
      sut = new StripesTranslationsPlugin(stripesConfig);
    });

    it('returns paths for emit hook and browser fetch', () => {
      const translations = {
        en: { key1: 'Value 1', key2: 'Value 2' },
      };
      sut.publicPath = '/';
      const result = sut.generateFileNames(translations);
      expect(result).to.be.an('object').with.property('en').with.property('browserPath').match(/^\/translations\/en-\d+\.json/);
      expect(result).to.be.an('object').with.property('en').with.property('emitPath').match(/^translations\/en-\d+\.json/);
    });

    it('applies publicPath', () => {
      const translations = {
        en: { key1: 'Value 1', key2: 'Value 2' },
      };
      sut.publicPath = '/my-public-path/';
      const result = sut.generateFileNames(translations);
      expect(result).to.be.an('object').with.property('en').with.property('browserPath').match(/^\/my-public-path\/translations\/en-\d+\.json/);
      expect(result).to.be.an('object').with.property('en').with.property('emitPath').match(/^translations\/en-\d+\.json/);
    });
  });
});

import { expect } from 'chai';
import sinon from 'sinon';

import StripesWebpackPlugin from '../../webpack/stripes-webpack-plugin.js';
import StripesConfigPlugin from '../../webpack/stripes-config-plugin.js';
import StripesTranslationsPlugin from '../../webpack/stripes-translations-plugin.js';
import StripesBrandingPlugin from '../../webpack/stripes-branding-plugin.js';
import StripesErrorLoggingPlugin from '../../webpack/stripes-error-logging-plugin.js';
import StripesDuplicatesPlugin from '../../webpack/stripes-duplicate-plugin.js';

const compilerStub = {
  apply: () => {},
  plugin: () => {},
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
      tap: () => {},
    },
    emit: {
      tapAsync: () => {},
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

describe('The stripes-webpack-plugin', function () {
  describe('apply method', function () {
    let sut;

    beforeEach(function () {
      sinon.stub(StripesConfigPlugin.prototype, 'apply').callsFake(() => {});
      sinon.stub(StripesBrandingPlugin.prototype, 'apply').callsFake(() => {});
      sinon.stub(StripesErrorLoggingPlugin.prototype, 'apply').callsFake(() => {});
      sinon.stub(StripesTranslationsPlugin.prototype, 'apply').callsFake(() => {});
      sinon.stub(StripesDuplicatesPlugin.prototype, 'apply').callsFake(() => {});
      sut = new StripesWebpackPlugin({ stripesConfig: mockConfig });
    });

    afterEach(function () {
      delete compilerStub.hooks.stripesConfigPluginBeforeWrite;
    });

    it('applies StripesConfigPlugin', function () {
      sut.apply(compilerStub);
      expect(StripesConfigPlugin.prototype.apply).to.have.been.calledOnce;
      expect(StripesConfigPlugin.prototype.apply).to.be.calledWith(compilerStub);
    });

    it('applies StripesBrandingPlugin', function () {
      sut.apply(compilerStub);
      expect(StripesBrandingPlugin.prototype.apply).to.have.been.calledOnce;
      expect(StripesBrandingPlugin.prototype.apply).to.be.calledWith(compilerStub);
    });

    it('applies StripesErrorLoggingPlugin', function () {
      sut.apply(compilerStub);
      expect(StripesErrorLoggingPlugin.prototype.apply).to.have.been.calledOnce;
      expect(StripesErrorLoggingPlugin.prototype.apply).to.be.calledWith(compilerStub);
    });

    it('applies StripesTranslationsPlugin', function () {
      sut.apply(compilerStub);
      expect(StripesTranslationsPlugin.prototype.apply).to.have.been.calledOnce;
      expect(StripesTranslationsPlugin.prototype.apply).to.be.calledWith(compilerStub);
    });

    it('applies StripesDuplicatesPlugin', function () {
      sut.apply(compilerStub);
      expect(StripesDuplicatesPlugin.prototype.apply).to.have.been.calledOnce;
      expect(StripesDuplicatesPlugin.prototype.apply).to.be.calledWith(compilerStub);
    });
  });
});

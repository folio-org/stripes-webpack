const expect = require('chai').expect;

const HtmlWebpackPlugin = require('html-webpack-plugin');
const defaultBranding = require('../../default-assets/branding');
const StripesBrandingPlugin = require('../../webpack/stripes-branding-plugin');

// Sample data for test
const tenantBranding = {
  logo: {
    src: './path/to/my-logo.png',
    alt: 'my alt',
  },
  favicon: {
    src: './path/to/my-favicon.ico',
  },
};

// Stub the parts of the webpack compiler that the StripesBrandingPlugin interacts with
const compilerStub = {
  apply: () => { },
  plugin: () => { },
  options: {
    plugins: ['something', {}, new HtmlWebpackPlugin()], // sample plugin data
  },
  hooks: {
    make: {
      tapAsync: () => { },
      tapPromise: () => { },
    },
    compilation: {
      tap: () => { },
    },
    afterCompile: {
      tapPromise: () => { },
    },
    emit: {
      tapAsync: () => { },
    },
    initialize: {
      tap: () => { },
    }
  },
  context: ''
};

describe('The stripes-branding-plugin', function () {
  describe('constructor', function () {
    it('uses default branding', function () {
      const sut = new StripesBrandingPlugin();
      expect(sut.branding).to.be.an('object').with.property('logo');
      expect(sut.branding).to.deep.include(defaultBranding);
    });

    it('accepts tenant branding', function () {
      const sut = new StripesBrandingPlugin({ tenantBranding });
      expect(sut.branding).to.be.an('object').with.property('logo');
      expect(sut.branding).to.deep.include(tenantBranding);
    });
  });
});

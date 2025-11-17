const HtmlWebpackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const defaultBranding = require('../default-assets/branding');
const StripesBrandingPlugin = require('./stripes-branding-plugin');

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

describe('The stripes-branding-plugin', () => {
  describe('constructor', () => {
    it('uses default branding', () => {
      const sut = new StripesBrandingPlugin();
      expect(sut.branding).toMatchObject(defaultBranding);
    });

    it('accepts tenant branding', () => {
      const sut = new StripesBrandingPlugin({ tenantBranding });
      expect(sut.branding).toMatchObject(tenantBranding);
    });
  });

  describe('apply method', () => {
    it('applies the FaviconsWebpackPlugin', () => {
      const spy = jest.spyOn(FaviconsWebpackPlugin.prototype, 'apply');
      const sut = new StripesBrandingPlugin();
      sut.apply(compilerStub);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(compilerStub);
      spy.mockRestore();
    });
  });

  describe('_getFaviconOptions method', () => {
    it('enables all favicons when "buildAllFavicons" is true', () => {
      const sut = new StripesBrandingPlugin({ buildAllFavicons: true });
      const options = sut._getFaviconOptions();
      expect(options.icons).toMatchObject({
        android: true,
        appleIcon: true,
        appleStartup: true,
        coast: true,
        favicons: true,
        firefox: true,
        windows: true,
        yandex: true,
      });
    });

    it('enables only standard favicons when "buildAllFavicons" is false', () => {
      const sut = new StripesBrandingPlugin({ buildAllFavicons: false });
      const options = sut._getFaviconOptions();
      expect(options.icons).toMatchObject({
        android: false,
        appleIcon: false,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: false,
        windows: false,
        yandex: false,
      });
    });
  });

  describe('_initFavicon method', () => {
    it('returns an absolute file path without @folio/stripes-core for default favicon', () => {
      const result = StripesBrandingPlugin._initFavicon(defaultBranding.favicon.src);
      expect(result).not.toContain('@folio/stripes-core');
      expect(result.charAt(0)).toBe('/');
    });

    it('returns an absolute file path for tenant favicon', () => {
      const result = StripesBrandingPlugin._initFavicon(tenantBranding.favicon.src);
      expect(result).toContain(tenantBranding.favicon.src.replace('.', ''));
      expect(result.charAt(0)).toBe('/');
    });
  });
});

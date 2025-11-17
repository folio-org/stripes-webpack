const defaultBranding = require('../default-assets/branding');
const { serializeWithRequire } = require('./stripes-serialize');

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

describe('The stripes-serialize module', () => {
  describe('serializeWithRequire function', () => {
    it('maintains absolute src paths', () => {
      const result = serializeWithRequire(defaultBranding);
      expect(result).toEqual(expect.any(String));
      expect(result).toContain(`'${defaultBranding.logo.src}'`);
    });

    it('updates custom src paths', () => {
      const result = serializeWithRequire(tenantBranding);
      expect(result).toEqual(expect.any(String));
      expect(result).toContain(`'.${tenantBranding.logo.src}'`);
      expect(result).not.toContain(`'${tenantBranding.logo.src}'`);
    });

    it('wraps src values in require()', () => {
      const result = serializeWithRequire(tenantBranding);
      expect(result).toContain('"src": require(');
    });

    it('does not wrap non-src values in require()', () => {
      const result = serializeWithRequire(tenantBranding);
      expect(result).not.toContain('"alt": require(');
    });
  });
});

const babelLoaderRule = require('./esbuild-loader-rule');

describe('The esbuild-loader-rule', () => {
  describe('test condition function', () => {
    let sut;

    beforeEach(() => {
      sut = babelLoaderRule(['@folio/inventory']);
    });

    it('selects files for @folio scoped node_modules', () => {
      const fileName = '/projects/folio/folio-testing-platform/node_modules/stripes-config';
      expect(sut.include(fileName)).toBe(true);
    });

    it('does not select node_modules files outside of @folio scope', () => {
      const fileName = '/projects/folio/folio-testing-platform/node_modules/lodash/lodash.js';
      expect(sut.include(fileName)).toBe(false);
    });

    it('only selects .js file extensions', () => {
      const fileName = '/project/folio/folio-testing-platform/node_modules/@folio/search/package.json';
      expect(fileName.match(sut.test)).toBeNull();
    });

    it('selects files outside of both @folio scope and node_modules', () => {
      // This test case would hold true for yarn-linked modules, @folio scoped or otherwise
      // Therefore this implies that we are not yarn-linking any non-@folio scoped modules
      const fileName = '/projects/folio/stripes-core/src/configureLogger.js';
      expect(sut.include(fileName)).toBe(true);
    });
  });
});

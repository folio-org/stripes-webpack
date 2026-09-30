const babelLoaderRule = require('./esbuild-loader-rule');

describe('The esbuild-loader-rule', function () {
  describe('test condition function', function () {
    let rule;
    beforeEach(function () {
      rule = babelLoaderRule(['@folio/inventory']);
    });

    it('selects files for @folio scoped node_modules', function () {
      const fileName = '/projects/folio/folio-testing-platform/node_modules/stripes-config';
      expect(rule.include(fileName)).toBe(true);
    });

    it('does not select node_modules files outside of @folio scope', function () {
      const fileName = '/projects/folio/folio-testing-platform/node_modules/lodash/lodash.js';
      expect(rule.include(fileName)).toBe(false);
    });

    it('only selects .js file extensions', function () {
      const fileName = '/project/folio/folio-testing-platform/node_modules/@folio/search/package.json';
      expect(fileName.match(rule.test)).toBe(null);
    });

    it('selects files outside of both @folio scope and node_modules', function () {
      // This test case would hold true for yarn-linked modules, @folio scoped or otherwise
      // Therefore this implies that we are not yarn-linking any non-@folio scoped modules
      const fileName = '/projects/folio/stripes-core/src/configureLogger.js';
      expect(rule.include(fileName)).toBe(true);
    });
  });
});

const expect = require('chai').expect;
const babelLoaderRule = require('../../webpack/babel-loader-rule');

describe.only('The babel-loader-rule', function () {
  describe('test condition function', function () {
    beforeEach(function () {
      this.sut = babelLoaderRule(['@folio/inventory']);
    });

    it('selects files for @folio scoped node_modules', function () {
      const fileName = '/projects/folio/folio-testing-platform/node_modules/stripes-config';
      const result = this.sut.include(fileName);
      expect(result).to.equal(true);
    });

    it('does not select node_modules files outside of @folio scope', function () {
      const fileName = '/projects/folio/folio-testing-platform/node_modules/lodash/lodash.js';
      const result = this.sut.include(fileName);
      expect(result).to.equal(false);
    });

    it('only selects .js file extensions', function () {
      const fileName = '/project/folio/folio-testing-platform/node_modules/@folio/search/package.json';
      const result = fileName.match(this.sut.test);
      expect(result).to.equal(null);
    });

    it('selects files outside of both @folio scope and node_modules', function () {
      // This test case would hold true for yarn-linked modules, @folio scoped or otherwise
      // Therefore this implies that we are not yarn-linking any non-@folio scoped modules
      const fileName = '/projects/folio/stripes-core/src/configureLogger.js';
      const result = this.sut.include(fileName);
      expect(result).to.equal(true);
    });
  });
});

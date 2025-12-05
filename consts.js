// TODO: should these come from https://github.com/folio-org/stripes-core/blob/1d5d4f00a3756702e828856d4ef9349ceb9f1c08/package.json#L116-L129
// Anythign that we want *the platform to provide to modules should be here.
// If an item is not in this list, modules will each load their own version of it.
// This can be problematic for React Context if mutliple copies of the same context are loaded.

const singletons = {
  '@folio/stripes': '^9.3.0',
  '@folio/stripes-components': '^13.1.0',
  '@folio/stripes-connect': '^10.0.1',
  '@folio/stripes-core': '^11.1.0',
  '@folio/stripes-shared-context': '^1.0.0',
  "moment": "^2.29.0",
  'react': '~18.3',
  'react-dom': '~18.3',
  'react-intl': '^7.1.14',
  'react-query': '^3.39.3',
  'react-redux': '^8.1',
  'react-router': '^5.2.0',
  'react-router-dom': '^5.2.0',
  'redux-observable': '^1.2.0',
  'rxjs': '^6.6.3'
};

const defaultentitlementUrl = 'http://localhost:3001/registry';

module.exports = {
  defaultentitlementUrl,
  singletons,
};

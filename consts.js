// The list of the default externals
// https://webpack.js.org/configuration/externals/
const defaultExternals = [
  '@folio/stripes',
  '@folio/stripes-components',
  '@folio/stripes-connect',
  '@folio/stripes-core',
  '@folio/stripes-util',
  '@folio/stripes-form',
  '@folio/stripes-final-form',
  '@folio/stripes-logger',
  '@folio/stripes-smart-components',
  'final-form',
  'final-form-arrays',
  'moment',
  'moment-timezone',
  'react',
  'react-dom',
  'react-final-form',
  'react-final-form-arrays',
  'react-final-form-listeners',
  'react-intl',
  'react-query',
  'react-redux',
  'react-router',
  'redux',
  'stripes-config',
];

module.exports = {
  defaultExternals,
};

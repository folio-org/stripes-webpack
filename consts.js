// The list of the default externals
// https://webpack.js.org/configuration/externals/
const defaultExternals = [
  'react',
  'react-dom',
  'react-intl',
  'react-router',
  'react-query',
  'moment',
  'moment-timezone',
  'redux',
  'react-redux',
  'stripes-config',
  '@folio/stripes',
  '@folio/stripes-connect',
  '@folio/stripes-core',
  '@folio/stripes-components',
  '@folio/stripes-util',
  '@folio/stripes-form',
  '@folio/stripes-final-form',
  '@folio/stripes-logger',
  '@folio/stripes-smart-components',
];

module.exports = {
  defaultExternals,
};

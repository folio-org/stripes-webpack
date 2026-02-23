const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// processExternals
// Accepts a list of peerDeps in the shape of an object
// with  { [packageName]: [version] }
// this generates configuration for setting the peer dep as
// an 'external' dependency for webpack, meaning it won't be bundled,
// but will be expected to exist where the bundle is executed.
// the different module types adjust the way webpack transforms the code when
// an external module is encountered within a particular module.
const processExternals = (peerDeps) => {
  return Object.keys(peerDeps).reduce((acc, name) => {
    acc[name] = {
      root: name,
      commonjs2: name,
      commonjs: name,
      amd: name,
      umd: name
    };

    return acc;
  }, {});
};

// processShared
// This function takes an object of shared dependencies in the shape of
// { [packageName]: [version] } ex { '@folio/stripes': '^9.3.0' }
// and applies additional options for the module federation configuration,
// like setting the shared items as singletons, or using the 'eager' consumption
// setting (chunks are included in the initial bundle whether than split out/lazy loaded)
const processShared = (shared, options = {}) => {
  return Object.keys(shared).reduce((acc, name) => {
    acc[name] = {
      requiredVersion: shared[name],
      ...options
    };

    return acc;
  }, {});
};

module.exports = {
  processExternals,
  isDevelopment,
  isProduction,
  processShared,
};

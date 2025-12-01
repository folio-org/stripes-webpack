const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const externMapping = {
  'stripes-config': 'stripes-config',
};

const processExternals = (peerDeps) => {
  // return Object.keys(peerDeps).reduce((acc, name) => {
  //   acc[name] = {
  //     root: name,
  //     commonjs2: name,
  //     commonjs: name,
  //     amd: name,
  //     umd: name
  //   };

  //   return acc;
  // }, {});
  const externs = {};
  Object.keys(peerDeps).forEach((dep) => {
    if (externMapping[dep]) {
      externs[dep] = externMapping[dep];
    } else {
      externs[dep] = dep;
    }
  });
  return externs;
};

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

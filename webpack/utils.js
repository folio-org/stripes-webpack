const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const processExternals = (externals) => {
  return externals.reduce((acc, name) => {
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

module.exports = {
  processExternals,
  isDevelopment,
  isProduction,
};

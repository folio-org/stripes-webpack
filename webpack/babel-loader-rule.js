const babelOptions = require('./babel-options');
const {
  getNonTranspiledModules,
  getTranspiledModules,
} = require('./module-paths');

// a space delimited list of strings (typically namespaces) to use in addition
// to "@folio" to determine if something needs Stripes-flavoured transpilation
const extraTranspile = process.env.STRIPES_TRANSPILE_TOKENS ? new RegExp(process.env.STRIPES_TRANSPILE_TOKENS.replaceAll(' ', '|')) : '';

module.exports = (modulePaths) => {
  const modulesToTranspile = getNonTranspiledModules(modulePaths);
  const transpiledModules = getTranspiledModules(modulePaths);
  const includeRegex = modulesToTranspile.length ? new RegExp(modulesToTranspile.join('|')) : null;
  const excludeRegex = transpiledModules.length ? new RegExp(transpiledModules.join('|')) : null;

  console.info('modules to transpile:', modulesToTranspile);
  console.info('transpiled modules:', transpiledModules);

  return {
    loader: 'babel-loader',
    test: /\.js$/,
    include: function(modulePath) {
      // exclude empty modules
      if (!modulePath) {
        return false;
      }

      // regex which represents modules which should be included for transpilation
      if (includeRegex && includeRegex.test(modulePath)) {
        return true;
      }

      // include STRIPES_TRANSPILE_TOKENS in transpilation
      if (extraTranspile && extraTranspile.test(modulePath)) {
        return true;
      }

      // regex which represents modules which should be excluded from transpilation
      if (excludeRegex && excludeRegex.test(modulePath)) {
        return false;
      }

      if (/node_modules/.test(modulePath)) {
        return false;
      }

      return true;
    },
    options: {
      cacheDirectory: true,
      ...babelOptions,
    },
  };
};

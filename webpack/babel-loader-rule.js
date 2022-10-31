const babelOptions = require('./babel-options');
const { getModulesPaths, getStripesModulesPaths, getNonTranspiledModules } = require('./module-paths');

// a space delimited list of strings (typically namespaces) to use in addition
// to "@folio" to determine if something needs Stripes-flavoured transpilation
const extraTranspile = process.env.STRIPES_TRANSPILE_TOKENS ? new RegExp(process.env.STRIPES_TRANSPILE_TOKENS.replaceAll(' ', '|')) : '';
const excludeRegex = /node_modules/;

module.exports = (stripesConfig) => {
  const modulePaths = getModulesPaths(stripesConfig.modules);
  const stripesModulePaths = getStripesModulesPaths();
  const modulesToTranspile = getNonTranspiledModules([...stripesModulePaths, ...modulePaths]);
  const includeRegex = new RegExp(modulesToTranspile.join('|'));

  console.info('modules to transpile:', modulesToTranspile);

  return {
    loader: 'babel-loader',
    test: /\.js$/,
    include: function(modulePath) {
      // exclude empty modules
      if (!modulePath) {
        return false;
      }

      // regex which represents modules which should be included for transpilation
      if (includeRegex.test(modulePath)) {
        return true;
      }

      // include STRIPES_TRANSPILE_TOKENS in transpilation
      // TODO: Should we check if the modules listed in STRIPES_TRANSPILE_TOKENS are
      // already transpiled (the dist folder exists).
      if (extraTranspile && extraTranspile.test(modulePath)) {
        return true;
      }

      // regex which represents modules which should be excluded from transpilation
      if (excludeRegex.test(modulePath)) {
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

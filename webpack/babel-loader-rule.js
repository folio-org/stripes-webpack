const babelOptions = require('./babel-options');

// a space delimited list of strings (typically namespaces) to use in addition
// to "@folio" to determine if something needs Stripes-flavoured transpilation
const extraTranspile = process.env.STRIPES_TRANSPILE_TOKENS ? new RegExp(process.env.STRIPES_TRANSPILE_TOKENS.replaceAll(' ', '|')) : '';
// TODO: check if dist is present before excluding
const excludeRegex = /node_modules|stripes/;
const includeRegex = /stripes-config|stripes-web/;

module.exports = {
  loader: 'babel-loader',
  test: /\.js$/,
  include: function(modulePath) {
    // exclude empty modules
    if (!modulePath) {
      return false;
    }

    if (includeRegex.test(modulePath)) {
      console.log('include', modulePath);
      return true;
    }

    if (extraTranspile && extraTranspile.test(modulePath)) {
      return true;
    }

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

const path = require('path');
const postCssImport = require('postcss-import');
const autoprefixer = require('autoprefixer');
const postCssCustomProperties = require('postcss-custom-properties');
const postCssCalc = require('postcss-calc');
const postCssNesting = require('postcss-nesting');
const postCssCustomMedia = require('postcss-custom-media');
const postCssMediaMinMax = require('postcss-media-minmax');
const postCssColorFunction = require('postcss-color-function');
const postCssRelativeColorSyntax = require('@csstools/postcss-relative-color-syntax');
const { generateStripesAlias, tryResolve } = require('./webpack/module-paths');

const locateCssVariables = () => {
  const variables = 'lib/variables.css';
  const localPath = path.join(path.resolve(), variables);

  // check if variables are present locally (in cases when stripes-components is
  // being built directly) if not look for them via stripes aliases
  return tryResolve(localPath) ?
    localPath :
    path.join(generateStripesAlias('@folio/stripes-components'), variables);
};

module.exports = {
  plugins: [
    postCssImport(),
    autoprefixer(),
    postCssCustomProperties({
      preserve: false,
      importFrom: [locateCssVariables()],
      disableDeprecationNotice: true
    }),
    postCssCalc(),
    postCssNesting(),
    postCssCustomMedia(),
    postCssMediaMinMax(),
    postCssRelativeColorSyntax(),
    postCssColorFunction(),
  ],
};

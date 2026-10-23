import path from 'path';
import postCssImport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import postCssCustomMedia from 'postcss-custom-media';
import postCssGlobalData from '@csstools/postcss-global-data';
import postCssRelativeColorSyntax from '@csstools/postcss-relative-color-syntax';
import postCssOmitImports from './webpack/postcss-omit-imports.js';
import { generateStripesAlias, tryResolve } from './webpack/module-paths.js';

const locateCssVariables = () => {
  const variables = 'lib/variables.css';
  const localPath = path.join(path.resolve(), variables);

  // check if variables are present locally (in cases when stripes-components is
  // being built directly) if not look for them via stripes aliases
  return tryResolve(localPath) ?
    localPath :
    path.join(generateStripesAlias('@folio/stripes-components'), variables);
};

export default {
  plugins: [
    // postcssGlobalData to import custom media queries so that those can be successfully resolve
    postCssGlobalData({
      files: [
        locateCssVariables()
      ]
    }),
    // ignore any imports of variables to keep those from being inlined...
    postCssImport({filter: (path) => !/variables/.test(path)}),
    // strip out imports of variables to prevent variable reset via a custom postcss plugin.
    postCssOmitImports({ contains: /variables/ }),
    autoprefixer(),
    postCssCustomMedia(),
    postCssRelativeColorSyntax(),
  ],
};

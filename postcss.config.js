import path from 'path';
import { fileURLToPath } from 'url';
import postCssImport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import postCssCustomMedia from 'postcss-custom-media';
import postCssGlobalData from '@csstools/postcss-global-data';
import postCssRelativeColorSyntax from '@csstools/postcss-relative-color-syntax';
import { generateStripesAlias, tryResolve } from './vite/module-paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    autoprefixer(),
    postCssCustomMedia(),
    postCssRelativeColorSyntax(),
  ],
};

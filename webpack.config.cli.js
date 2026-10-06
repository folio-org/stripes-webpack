// Base Webpack configuration for building Stripes at the command line,
// including Stripes configuration.

import path from 'path';

export default {
  output: {
    path: path.join(import.meta.dirname, 'dist'),
    filename: 'bundle.[name][contenthash].js',
    chunkFilename: 'chunk.[name][chunkhash].js',
    publicPath: '/',
  },
};

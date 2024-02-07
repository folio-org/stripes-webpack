// Base Webpack configuration for building Stripes at the command line,
// including Stripes configuration.

const path = require('path');

module.exports = {
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.[name][contenthash].js',
    chunkFilename: 'chunk.[name][chunkhash].js',
    publicPath: '/',
    clean: true,
    devtoolModuleFilenameTemplate: 'file:///[absolute-resource-path]'  // map to source with absolute file path not webpack:// protocol
  },
};

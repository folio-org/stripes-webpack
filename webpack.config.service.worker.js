const path = require('path');

const config = {
  name: 'service-worker',
  mode: 'development',
  target: 'web',
  entry: {
    'service-worker': {
      import: '@folio/stripes-core/src/service-worker.js',
      filename: 'service-worker.js',
    }
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'service-worker.js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'esbuild-loader',
        options: {
          target: 'es2015'
        }
      },
    ]
  }
};

module.exports = config;

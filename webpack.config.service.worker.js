const path = require('path');
const VirtualModulesPlugin = require('webpack-virtual-modules');

const buildConfig = (stripesConfig) => {
  const { okapi } = stripesConfig;
  const virtualModules = new VirtualModulesPlugin({
    'node_modules/micro-stripes-config.js': `module.exports = { okapiUrl: '${okapi.url}', okapiTenant: '${okapi.tenant}' };`,
  });

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
    plugins: [
      virtualModules
    ],
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

  return config;
}

module.exports = buildConfig;

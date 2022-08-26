// Top level Webpack configuration for running a development environment
// from the command line via devServer.js

const path = require('path');
const webpack = require('webpack');

const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const { generateStripesAlias, tryResolve } = require('./webpack/module-paths');
const utils = require('./webpack/utils');

const base = require('./webpack.config.base');
const cli = require('./webpack.config.cli');

const stripesComponentsStyles = tryResolve(path.join(generateStripesAlias('@folio/stripes-components'), 'dist/style.css'));
const stripesCoreStyles = tryResolve(path.join(generateStripesAlias('@folio/stripes-core'), 'dist/style.css'));


const useBrowserMocha = () => {
  return tryResolve('mocha/mocha-es2018.js') ? 'mocha/mocha-es2018.js' : 'mocha';
};

const devConfig = Object.assign({}, base, cli, {
  devtool: 'inline-source-map',
  mode: 'development',
  cache: {
    type: 'filesystem',
    name: 'FOLIOCache',
  },
  target: 'web',
  infrastructureLogging: {
    appendOnly: true,
    level: 'warn',
  },
});

// Override filename to remove the hash in development due to memory issues (STCOR-296)
devConfig.output.filename = 'bundle.js';
devConfig.entry = [
  'webpack-hot-middleware/client',
  '@folio/stripes-components/lib/global.css',
  '@folio/stripes-web',
];

if (stripesComponentsStyles) {
  devConfig.entry.push('@folio/stripes-components/dist/style.css')
}

if (stripesCoreStyles) {
  devConfig.entry.push('@folio/stripes-core/dist/style.css')
}


devConfig.plugins = devConfig.plugins.concat([
  new webpack.ProvidePlugin({
    process: 'process/browser.js',
  }),
]);

// include HMR plugins only when in development
if (utils.isDevelopment) {
  devConfig.plugins = devConfig.plugins.concat([
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin()
  ]);
}

// This alias avoids a console warning for react-dom patch
devConfig.resolve.alias.process = 'process/browser.js';
devConfig.resolve.alias['mocha'] = useBrowserMocha();

if (stripesComponentsStyles) {
  devConfig.module.rules.push({
    test: /\.css$/,
    include: [/dist\/style.css/],
    use: [
      {
        loader: 'style-loader'
      },
      {
        loader: 'css-loader',
        options: {
          modules: false
        },
      },
    ],
  });
}

devConfig.module.rules.push({
  test: /\.css$/,
  exclude: [/dist\/style.css/],
  use: [
    {
      loader: 'style-loader'
    },
    {
      loader: 'css-loader',
      options: {
        modules: {
          localIdentName: '[local]---[hash:base64:5]',
        },
        sourceMap: true,
        importLoaders: 1,
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          config: path.resolve(__dirname, 'postcss.config.js'),
        },
        sourceMap: true,
      },
    },
  ],
});

// add 'Buffer' global required for tests/reporting tools.
devConfig.plugins.push(
  new webpack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer']
  })
);

// add resolutions for node utilities required for test suites.
devConfig.resolve.fallback = {
  "crypto": require.resolve('crypto-browserify'),
  "stream": require.resolve('stream-browserify'),
  "util": require.resolve('util-ex'),
};

devConfig.module.rules.push(
  {
    test: /\.svg$/,
    use: [{
      loader: 'url-loader',
      options: {
        esModule: false,
      },
    }]
  },
);

module.exports = devConfig;

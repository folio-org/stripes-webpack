// Top level Webpack configuration for building static files for
// production deployment from the command line

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

const { getSharedStyles } = require('./webpack/module-paths');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const { generateStripesAlias, tryResolve } = require('./webpack/module-paths');
const base = require('./webpack.config.base');
const cli = require('./webpack.config.cli');

const stripesComponentsStyles = tryResolve(path.join(generateStripesAlias('@folio/stripes-components'), 'dist/style.css'));
const stripesCoreStyles = tryResolve(path.join(generateStripesAlias('@folio/stripes-core'), 'dist/style.css'));

const prodConfig = Object.assign({}, base, cli, {
  mode: 'production',
  devtool: 'source-map',
  infrastructureLogging: {
    appendOnly: true,
    level: 'warn',
  }
});

// TODO: the same will have to happen for every UI module
if (stripesComponentsStyles) {
  prodConfig.entry.css.push('@folio/stripes-components/dist/style.css');
}

if (stripesCoreStyles) {
  prodConfig.entry.css.push('@folio/stripes-core/dist/style.css');
}

const smp = new SpeedMeasurePlugin();

prodConfig.plugins = prodConfig.plugins.concat([
  new webpack.ProvidePlugin({
    process: 'process/browser.js',
  }),
]);

prodConfig.resolve.alias = {
  ...prodConfig.resolve.alias,
  "stcom-interactionStyles": getSharedStyles("lib/sharedStyles/interactionStyles"),
  "stcom-variables": getSharedStyles("lib/variables"),
};

prodConfig.optimization = {
  mangleWasmImports: false,
  minimizer: [
    new TerserPlugin({
      // exclude stripes junk from minimizer
      exclude: /stripes/
    }),
    new CssMinimizerPlugin(),
  ],
  splitChunks: {
    // Do not process stripes chunk
    chunks: (chunk) => {
      return chunk.name !== 'stripes';
    },
    cacheGroups: {
      stripes: {
        // TODO: only include already transpiled modules
        test: /stripes/,
        name: 'stripes',
        chunks: 'all'
      },
    },
  },
  minimize: true,
}

if (stripesComponentsStyles) {
  prodConfig.module.rules.push({
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


prodConfig.module.rules.push({
  test: /\.css$/,
  exclude: [/dist\/style.css/],
  use: [
    {
      loader: MiniCssExtractPlugin.loader,
    },
    {
      loader: 'css-loader',
      options: {
        modules: {
          localIdentName: '[local]---[hash:base64:5]',
        },
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

prodConfig.module.rules.push(
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

const webpackConfig = smp.wrap({ plugins: prodConfig.plugins });
webpackConfig.plugins.push(
  new MiniCssExtractPlugin({ filename: 'style.[contenthash].css' })
);

const config = {...prodConfig, ...webpackConfig };

module.exports = config;

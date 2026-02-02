// This configuration file is used for building individual ui modules for a
// federated module platform setup.
// "icons", "translations", "sound" folders are statically hosted in the devServer config.
// "icons" and "sound" directories, with subfolders are copied to the output folder for a production build.

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const StripesTranslationsPlugin = require('./webpack/stripes-translations-plugin');
const { container } = webpack;
const { processExternals, processShared } = require('./webpack/utils');
const { getStripesModulesPaths } = require('./webpack/module-paths');
const esbuildLoaderRule = require('./webpack/esbuild-loader-rule');
const typescriptLoaderRule = require('./webpack/typescript-loader-rule')
const { getHostAppSingletons } = require('./consts');

const buildConfig = (metadata, options) => {
  const { port, name, displayName, main } = metadata;

  // using main from metadata since the location of main could vary between modules.
  let mainEntry = path.join(process.cwd(), main || 'index.js');
  const stripesModulePaths = getStripesModulesPaths();
  const translationsPath = path.join(process.cwd(), 'translations', displayName.split('.').shift());
  const iconsPath = path.join(process.cwd(), 'icons');

  // yeah, yeah, soundsPath vs sound. sorry. `sound` is a legacy name.
  // other paths are plural and I'm sticking with that convention.
  const soundsPath = path.join(process.cwd(), 'sound');

  // Module federation resolves dependencies at runtime.
  // 'shared' holds a key-value list of modules and versions that are common between
  // the host app and the remote modules.
  // When a remote ui-module is loaded, module federation runtime will check these
  // dependencies and load the individual chunks accordingly.
  // For dependencies that are configured as singletons, only a single version will be loaded from the host app.
  // If a version is semver incompatible, a console warning will be emitted.
  const configSingletons = getHostAppSingletons();
  const shared = processShared(configSingletons, { singleton: true });

  // general webpack config.
  // Some noteworthy settings:
  //  publicPath: 'auto' setting will include a bit of runtime logic so that the
  //    loaded script can load its individual chunks.
  //    For more info, see https://webpack.js.org/guides/public-path/#automatic-publicpath
  //  entry: mainEntry - this is the 'trunk' of webpack's import tree - webpack will start here
  //    and work its way through the module. This file is also 'exposed' via the module-federation
  //    plugin as './MainEntry': mainEntry. When a remote module is loaded, the mod-fed api will
  //    load 'MainEntry' by name, which imports/requires the module.
  const config = {
    name,
    mode: options.mode || 'development',
    entry: mainEntry,
    output: {
      publicPath: 'auto', // webpack will determine publicPath of script at runtime.
      path: options.outputPath ? path.resolve(options.outputPath) : undefined
    },
    stats: {
      errorDetails: true
    },
    resolve: {
      extensions: ['.js', '.json', '.ts', '.tsx'],
    },
    module: {
      rules: [
        typescriptLoaderRule,
        esbuildLoaderRule(stripesModulePaths),
        {
          test: /\.(woff2?)$/,
          type: 'asset/resource',
          generator: {
            filename: './fonts/[name].[contenthash].[ext]',
          },
        },
        {
          test: /\.(mp3|m4a)$/,
          type: 'asset/resource',
          generator: {
            filename: './sound/[name].[contenthash].[ext]',
          },
        },
        {
          test: /\.css$/,
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
        },
        {
          test: /\.(jpg|jpeg|gif|png|ico)$/,
          type: 'asset/resource',
          generator: {
            filename: './img/[name].[contenthash].[ext]',
          },
        },
        {
          test: /\.svg$/,
          type: 'asset/inline',
          resourceQuery: { not: /icon/ } // exclude built-in icons from stripes-components which are loaded as react components.
        },
        {
          test: /\.svg$/,
          resourceQuery: /icon/, // stcom icons use this query on the resource.
          use: ['@svgr/webpack']
        },
        {
          test: /\.js.map$/,
          enforce: "pre",
          use: ['source-map-loader'],
        }
      ]
    },
    externals: processExternals({ 'stripes-config': true }),
    plugins: [
      new StripesTranslationsPlugin({ federate: true }),
      new MiniCssExtractPlugin({ filename: 'style.css', ignoreOrder: false }),
      // At runtime, the host app will
      // 1. load the remoteEntry.js script as directed by the module's location.
      // 2. remote entry requires its own set of chunks, determining location of those chunks (publicPath: 'auto' logic).
      // 3. The above are stored in a 'container' (webpack/mod-fed term) - a global variable by the 'name' field.
      //    The host app 'imports' the app via container.get('MainEntry') from the loaded code.
      new container.ModuleFederationPlugin({
        library: { type: 'var', name },
        name,
        filename: 'remoteEntry.js',
        exposes: {
          './MainEntry': mainEntry,
        },
        shared
      }),
    ]
  };

  // for a build/production mode copy sounds and icons to the output folder...
  if (options.mode === 'production') {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          { from: 'sound', to: 'sound', noErrorOnMissing: true },
          { from: 'icons', to: 'icons', noErrorOnMissing: true }
        ]
      })
    )
  } else {
    // in development mode, setup the devserver...
    config.devtool = 'inline-source-map';
    config.devServer = {
      port: port,
      open: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      static: [
        {
          directory: translationsPath,
          publicPath: '/translations'
        },
        {
          directory: iconsPath,
          publicPath: '/icons'
        },
        {
          directory: soundsPath,
          publicPath: '/sounds'
        },
      ]
    }
  }

  if (options.minify === false) {
    config.optimization = config.optimization || {};
    config.optimization.minimize = false;
  }

  return config;
}

module.exports = buildConfig;

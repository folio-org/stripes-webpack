const path = require('path');
const extraTranspile = process.env.STRIPES_TRANSPILE_TOKENS ? process.env.STRIPES_TRANSPILE_TOKENS.split(' ') : [];

// These modules are already transpiled and should be excluded
const folioScopeBlacklist = [
  'react-githubish-mentions',
].map(segment => path.join('@folio', segment));

// We want to transpile files inside node_modules/@folio or outside
// any node_modules directory. And definitely not files in
// node_modules outside the @folio namespace even if some parent
// directory happens to be in @folio.
//
// fn is the path after all symlinks are resolved so we need to be
// wary of all the edge cases yarn link will find for us.
function babelLoaderTest(fileName) {
  const nodeModIdx = fileName.lastIndexOf('node_modules');
  if (fileName.endsWith('.js')
    && (nodeModIdx === -1 || ['@folio', ...extraTranspile].reduce((acc, cur) => (fileName.lastIndexOf(cur) > nodeModIdx) || acc))
    && (folioScopeBlacklist.findIndex(ignore => fileName.includes(ignore)) === -1)) {
    return true;
  }
  return false;
}

module.exports = {
  test: babelLoaderTest,
  loader: 'babel-loader',
  options: {
    cacheDirectory: true,
    presets: [
      ['@babel/preset-env', { targets: '> 0.25%, not dead' }],
      ['@babel/preset-flow', { all: true }],
      ['@babel/preset-react', {
        "runtime": "automatic"
      }],
      ['@babel/preset-typescript'],
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { 'legacy': true }],
      // when building a platform directly, i.e. outside a workspace,
      // babel complains loudly and repeatedly that when these modules are enabled:
      // * @babel/plugin-proposal-class-properties,
      // * @babel/plugin-proposal-private-methods and
      // * @babel/plugin-proposal-private-property-in-object
      // the "loose" option must be the same for all three.
      // but @babel/preset-env sets it to false for ...private-methods.
      // overriding it here silences the complaint. STRWEB-12
      ['@babel/plugin-proposal-class-properties', { 'loose': true }],
      ['@babel/plugin-proposal-private-methods', { 'loose': true }],
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-function-sent',
      '@babel/plugin-proposal-numeric-separator',
      '@babel/plugin-proposal-throw-expressions',
      '@babel/plugin-syntax-import-meta',
      [require.resolve('react-hot-loader/babel')],
    ]
  },
};

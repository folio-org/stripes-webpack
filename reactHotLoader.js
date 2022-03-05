// Temporary solution to replace a real react-hot-loader
// with a webpack alias
// TODO: remove this after all UI modules remove reference to 'hot'
module.exports = {
  hot: () => Component => Component,
};

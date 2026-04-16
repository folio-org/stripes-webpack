const { getViteConfig } = require('./vite/utils');

module.exports = ({ stripesConfig = {}, options = {} } = {}) => getViteConfig(stripesConfig, options, 'serve');

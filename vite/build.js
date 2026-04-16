const { createBuildStats, getViteConfig, loadProjectModule } = require('./utils');

module.exports = async function viteBuild(stripesConfig, options = {}) {
  const { build } = loadProjectModule('vite', process.cwd());
  const config = getViteConfig(stripesConfig, options, 'build');
  const result = await build(config);

  return createBuildStats(result);
};

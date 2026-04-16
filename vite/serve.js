const { getViteConfig, loadProjectModule } = require('./utils');

module.exports = async function viteServe(stripesConfig, options = {}) {
  if (typeof stripesConfig.okapi !== 'object') throw new Error('Missing Okapi config');
  if (typeof stripesConfig.okapi.url !== 'string') throw new Error('Missing Okapi URL');
  if (stripesConfig.okapi.url.endsWith('/')) throw new Error('Trailing slash in Okapi URL will prevent Stripes from functioning');

  const { createServer } = loadProjectModule('vite', process.cwd());
  const config = getViteConfig(stripesConfig, options, 'serve');
  const server = await createServer(config);

  await server.listen();

  const localUrl = server.resolvedUrls?.local?.[0];
  if (localUrl) {
    console.log(`Listening at ${localUrl}`); // eslint-disable-line no-console
  }

  return server;
};

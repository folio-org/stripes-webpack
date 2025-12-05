// This plugin is used for local development/debugging related to Module Federation of ui-modules.
// it spawns child processes to start remote ui-modules defined in stripes.config.js if those modules are included
// within the same workspace. If the module is not within the same workspace, the 'stripes federate' command will have to be
// executed manually from the directory of that module.

const spawn = require('child_process').spawn;
const path = require('path');
const portfinder = require('portfinder');

const { locateStripesModule } = require('./module-paths');

portfinder.setBasePort(3002);

module.exports = class StripesLocalFederationPlugin {
  constructor(stripesConfig) {
    this.stripesConfig = stripesConfig;
  }

  async startRemotes(modules) {
    const ctx = process.cwd();

    for (const moduleName in modules) {
      const packageJsonPath = locateStripesModule(ctx, moduleName, {}, 'package.json');
      const basePath = path.dirname(packageJsonPath);

      portfinder.getPort((err, port) => {
        const child = spawn(`yarn stripes federate --port ${port}`, {
          cwd: basePath,
          shell: true,
        });

        child.stdout.pipe(process.stdout);
      });
    }
  }

  apply() {
    const { modules } = this.stripesConfig;

    this.startRemotes(modules);
  }
};

// This webpack plugin wraps all other stripes webpack plugins to simplify inclusion within the webpack config
const spawn = require('child_process').spawn;
const path = require('path');
const portfinder = require('portfinder');

const { locateStripesModule } = require('./module-paths');

portfinder.setBasePort(3002);

module.exports = class StripesFederationPlugin {
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

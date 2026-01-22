// Anythign that we want *the platform to provide to modules should be here.
// If an item is not in this list, modules will each load their own version of it.
// This can be problematic for React Context if mutliple copies of the same context are loaded.

const singletons = {
  '@folio/stripes-components': '^13.1.0',
  '@folio/stripes-connect': '^10.0.1',
  '@folio/stripes-core': '^11.1.0',
  "moment": "^2.29.0",
  'react': '~18.3',
  'react-dom': '~18.3',
  'react-intl': '^7.1.14',
  'react-query': '^3.39.3',
  'react-redux': '^8.1',
  'react-router': '^5.2.0',
  'react-router-dom': '^5.2.0',
  'redux-observable': '^1.2.0',
  'rxjs': '^6.6.3',
};

/** getHostAppSingletons
* get singletons from stripes-core package.json on Github.
*/
const getHostAppSingletons = () => {
  let platformSingletons = {};

  const handlePkgData = (corePkg) => {
    const pkgObject = corePkg.data ? JSON.parse(corePkg.data) : corePkg;
    const stripesCoreVersion = pkgObject.version;
    platformSingletons['@folio/stripes-core'] = `~${stripesCoreVersion}`;
    Object.keys(singletons).forEach(dep => {
      const depVersion = pkgObject.peerDependencies[dep];
      if (depVersion) {
        platformSingletons[dep] = depVersion;
      }
    });
    platformSingletons = { ...platformSingletons, ...singletons };
  }

  let corePkg;
  // try to get the locally installed stripes-core
  try {
    corePkg = require('@folio/stripes-core/package.json');
  } catch (e) {
    corePkg = singletons;
    throw new Error('Error retrieving singletons list from platform. Falling back to static list');
  }

  handlePkgData(corePkg);
  return platformSingletons;
}

const defaultentitlementUrl = 'http://localhost:3001/registry';

module.exports = {
  defaultentitlementUrl,
  singletons,
  getHostAppSingletons
};

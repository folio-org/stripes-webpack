const { Octokit } = require('@octokit/rest');

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
  'rxjs': '^6.6.3'
};

/** getHostAppSingletons
* get singletons from stripes-core package.json on Github.
*/
const getHostAppSingletons = async () => {
  const platformSingletons = {};

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
  }

  let corePkg;
  // try to get the locally installed stripes-core
  try {
    corePkg = require('@folio/stripes-core/package.json');
  } catch (e) {
    console.log('Unable to locate local stripes-core package.json, fetching from Github...');
    try {
      const octokit = new Octokit();
      corePkg = await octokit.request('GET /repos/folio-org/stripes-core/contents/package.json', {
        headers: {
          accept: 'application/vnd.github.raw+json'
        }
      });

      if (corePkg.status !== 200) {
        throw new Error('Error retrieving singletons list from platform. Falling back to static list');
      }
    } catch (e) {
      console.log(e);
      return singletons;
    }
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

const { Octokit } = require('@octokit/rest');

// Anythign that we want *the platform to provide to modules should be here.
// If an item is not in this list, modules will each load their own version of it.
// This can be problematic for React Context if mutliple copies of the same context are loaded.

const singletons = {
  '@folio/stripes': '^9.3.0',
  '@folio/stripes-components': '^13.1.0',
  '@folio/stripes-connect': '^10.0.1',
  '@folio/stripes-core': '^11.1.0',
  '@folio/stripes-shared-context': '^1.0.0',
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

/** getPlatformSingletons
* get singletons from platform deps
* TODO - specify versions/branches of platform/stripes and additional entries...
*/
const getPlatformSingletons = async () => {
  const platformSingletons = {};
  const octokit = new Octokit();

  try {
    const platformPkg = await octokit.request('GET /repos/folio-org/platform-complete/contents/package.json', {
      headers: {
        accept: 'application/vnd.github.raw+json'
      }
    });

    if (platformPkg.status === 200) {
      const pkgObject = JSON.parse(platformPkg.data);
      Object.keys(singletons).forEach(dep => {
        const depVersion = pkgObject.dependencies[dep];
        if (depVersion) {
          platformSingletons[dep] = depVersion;
        }
      });
    } else {
      throw new Error('Error retrieving singletons list from platform. Falling back to static list');
    }

    // fetch dep versions from stripes...
    const stripesPkg = await octokit.request('GET /repos/folio-org/stripes/contents/package.json', {
      headers: {
        accept: 'application/vnd.github.raw+json'
      }
    });

    if (stripesPkg.status === 200) {
      const pkgObject = JSON.parse(stripesPkg.data);
      Object.keys(singletons).forEach(dep => {
        const depVersion = pkgObject.dependencies[dep];
        if (depVersion) {
          platformSingletons[dep] = depVersion;
        }
      });
    } else {
      throw new Error('Error retrieving singletons list from stripes version. Falling back to static list');
    }

    return platformSingletons;
  } catch (e) {
    console.log(e);
    return singletons;
  }
}


const defaultentitlementUrl = 'http://localhost:3001/registry';

module.exports = {
  defaultentitlementUrl,
  singletons,
  getPlatformSingletons
};

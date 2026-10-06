import { expect } from 'chai';
import sinon from 'sinon';
import { jest } from '@jest/globals';

import * as actualModulePaths from '../../webpack/module-paths.js';

// ESM namespaces can't be stubbed, so replace module-paths with a mutable wrapper
const modulePaths = {
  locateStripesModule: actualModulePaths.locateStripesModule,
  tryResolve: actualModulePaths.tryResolve,
};
const resetPaths = () => Object.assign(modulePaths, actualModulePaths);
jest.unstable_mockModule('../../webpack/module-paths.js', () => ({
  ...actualModulePaths,
  locateStripesModule: (...a) => modulePaths.locateStripesModule(...a),
  tryResolve: (...a) => modulePaths.tryResolve(...a),
}));
const { StripesModuleParser, parseAllModules } = await import('../../webpack/stripes-module-parser.js');

let sut;
let packageJson;

afterEach(resetPaths);

const moduleName = '@folio/users';
const moduleConfig = {};
const context = '/path/to/folio-testing-platform';
const aliases = {
  react: '/path/to/node_modules/react',
};
const enabledModules = {
  '@folio/users': {},
  '@folio/search': {},
  '@folio/developer': {},
};
const icons = [
  {
    name: 'one',
    alt: 'alt for one',
    fileName: 'oneFile',
    title: 'a title for one'
  },
  {
    name: 'two',
    alt: 'alt for two',
    fileName: 'twoFile',
    title: 'a title for two'
  },
];
const welcomePageEntries = [
  {
    iconName: 'one',
    headline: 'welcome headline',
    description: 'welcome description'
  },
  {
    iconName: 'two',
    headline: 'another welcome headline',
    description: 'another welcome description'
  },
];
let mockPackageJson;

function getMockPackageJson(actsAs = 'app') {
  return (mod) => {
    return {
      name: mod,
      description: `description for ${mod}`,
      version: '1.0.0',
      stripes: {
        actsAs,
        displayName: `display name for ${mod}`,
        route: `/${mod}`,
        permissionSets: [],
        icons,
        welcomePageEntries,
      },
    };
  };
}

describe('The stripes-module-parser', () => {
  describe('loadPackageJson method', () => {
    it('throws StripesBuildError when package.json is missing', () => {
      modulePaths.locateStripesModule = () => false;
      try {
        sut = new StripesModuleParser(moduleName, moduleConfig, context, aliases);
        expect('never to be called').to.equal(true);
      } catch (err) {
        expect(err.message).to.match(/Unable to locate/);
      }
    });
  });

  describe('parsing methods', () => {
    beforeEach(() => {
      mockPackageJson = getMockPackageJson();
      packageJson = mockPackageJson('@folio/users');
      sinon.stub(StripesModuleParser.prototype, 'loadModulePackageJson').callsFake(mockPackageJson);
      modulePaths.tryResolve = () => true; // Mocks finding all the icon files
      sut = new StripesModuleParser(moduleName, moduleConfig, context, aliases);
      sut.modulePath = '/path/to/module';
    });

    describe('extractConfig', () => {
      it('returns a parsed config', () => {
        const result = sut.extractConfig('@folio/users', packageJson);
        expect(result).to.be.an('object').with.keys(
          'module', 'getModule', 'description', 'version', 'displayName', 'route', 'welcomePageEntries',
        );
      });

      it('applies overrides from tenant config', () => {
        sut.overrideConfig = { displayName: 'something else' };
        const result = sut.extractConfig('@folio/users', packageJson);
        expect(result.displayName).to.equal('something else');
      });

      it('assigns getModule function', () => {
        const result = sut.extractConfig('@folio/users', packageJson);
        expect(result.getModule).to.be.a('function');
      });
    });

    describe('extractMetadata', () => {
      it('returns metadata', () => {
        const result = sut.extractMetadata(packageJson);
        expect(result).to.be.an('object').with.keys(
          'name', 'version', 'description', 'license', 'feedback', 'type', 'shortTitle', 'fullTitle',
          'defaultPopoverSize', 'defaultPreviewWidth', 'helpPage', 'icons', 'welcomePageEntries',
          'subscribesTo',
        );
      });
    });

    describe('parseModule', () => {
      it('throws StripesBuildError when stripes is missing', () => {
        delete sut.packageJson.stripes;
        try {
          sut.parseModule();
          expect('never to be called').to.equal(true);
        } catch (err) {
          expect(err.message).to.match(/does not have a "stripes" key/);
        }
      });

      it('throws StripesBuildError when stripes.actsAs is missing', () => {
        delete sut.packageJson.stripes.actsAs;
        try {
          sut.parseModule();
          expect('never to be called').to.equal(true);
        } catch (err) {
          expect(err.message).to.match(/does not specify stripes\.actsAs/);
        }
      });
    });

    describe('getIconMetadata', () => {
      it('returns icon data by name', () => {
        const result = sut.getIconMetadata(icons);
        expect(result).to.be.an('object').with.all.keys('one', 'two');
        expect(result.one).to.include({
          alt: 'alt for one',
          title: 'a title for one',
        });
      });

      it('warns when icons are missing', () => {
        sut.getIconMetadata(undefined, true);
        expect(sut.warnings[0]).to.match(/no icons defined/);
      });

      it('uses icon.fileName for building file paths', () => {
        const result = sut.getIconMetadata(icons);
        expect(result.one).to.include({
          src: '/path/to/module/icons/oneFile.svg',
        });
      });

      it('falls back to icon.name when icon.fileName is not specified', () => {
        const iconsNoFileName = [
          {
            name: 'one',
            alt: 'alt for one',
            title: 'a title for one'
          },
        ];
        const result = sut.getIconMetadata(iconsNoFileName);
        expect(result.one).to.include({
          src: '/path/to/module/icons/one.svg',
        });
      });
    });

    describe('buildIconFilePaths', () => {
      it('returns all file variants (high/low)', () => {
        const result = sut.buildIconFilePaths('one');
        expect(result).to.deep.include({
          high: { src: '/path/to/module/icons/one.svg' },
          low: { src: '/path/to/module/icons/one.png' },
        });
      });

      it('returns default icon src', () => {
        const result = sut.buildIconFilePaths('one');
        expect(result).to.deep.include({
          src: '/path/to/module/icons/one.svg',
        });
      });

      it('does not return paths for missing icons', () => {
        modulePaths.tryResolve = () => false;
        const result = sut.buildIconFilePaths('one');
        expect(result).to.deep.include({
          high: { src: '' },
          low: { src: '' },
        });
      });

      it('warns for missing icons variants', () => {
        modulePaths.tryResolve = () => false;
        sut.buildIconFilePaths('one');
        expect(sut.warnings[0]).to.match(/missing file/);
      });
    });

    describe('getWelcomePageEntries', () => {
      it('returns array of welcomePageEntries', () => {
        const parsedIcons = sut.getIconMetadata(icons);
        const result = sut.getWelcomePageEntries(welcomePageEntries, parsedIcons);
        expect(result).to.be.an('array').with.length(2);
        expect(result[0]).to.deep.equal(welcomePageEntries[0]);
      });

      it('warns when a missing icon is referenced', () => {
        const parsedIcons = sut.getIconMetadata(icons);
        delete parsedIcons.one;
        sut.getWelcomePageEntries(welcomePageEntries, parsedIcons);
        expect(sut.warnings[0]).to.match(/no matching stripes.icons/);
      });
    });
  });
});

describe('parseAllModules function', () => {
  describe('module type is "app"', () => {
    beforeEach(() => {
      mockPackageJson = getMockPackageJson();
      sinon.stub(StripesModuleParser.prototype, 'loadModulePackageJson').callsFake(mockPackageJson);
      modulePaths.tryResolve = () => true; // Mocks finding all the icon files
      sut = parseAllModules;
    });

    it('returns config and metadata collections', () => {
      const result = sut(enabledModules, context, aliases);
      expect(result).to.be.an('object').with.all.keys('config', 'metadata', 'stripesDeps', 'icons', 'warnings');
    });

    it('returns config grouped by stripes type', () => {
      const result = sut(enabledModules, context, aliases);
      expect(result.config).to.be.an('object').with.property('app').that.is.an('array');
      expect(result.config.app.length).to.equal(3);
      expect(result.config.app[0]).to.be.an('object').with.keys(
        'module', 'getModule', 'description', 'version', 'displayName', 'route', 'welcomePageEntries',
      );
    });

    it('returns metadata for each module', () => {
      const result = sut(enabledModules, context, aliases);
      expect(result.metadata).to.be.an('object').with.all.keys('users', 'search', 'developer');
      expect(result.warnings).to.be.an('array').with.lengthOf(0);
    });

    it('returns warnings for each module', () => {
      modulePaths.tryResolve = () => false; // Mock missing files
      const result = sut(enabledModules, context, aliases);
      expect(result.warnings).to.be.an('array').with.lengthOf.at.least(1);
    });
  });

  describe('module acts as "settings" and "plugin"', () => {
    beforeEach(() => {
      mockPackageJson = getMockPackageJson(['settings', 'plugin']);
      sinon.stub(StripesModuleParser.prototype, 'loadModulePackageJson').callsFake(mockPackageJson);
      modulePaths.tryResolve = () => true; // Mocks finding all the icon files
      sut = parseAllModules;
    });

    it('actsAs settings and plugin produces the expected settings and plugin configs and no app config', () => {
      const result = sut(enabledModules, context, aliases);
      expect(result.config.app).to.be.an('array').with.lengthOf(0);
      expect(result.config.settings).to.be.an('array').with.lengthOf(3);
      expect(result.config.plugin).to.be.an('array').with.lengthOf(3);
    });
  });
});

describe('integration', () => {
  const result = parseAllModules({ '@folio/app1': {}, '@folio/app2': {} }, import.meta.dirname, aliases);
  it('sees the right number of apps', () => {
    expect(result.config.app).to.be.an('array').with.lengthOf(2);
  });
  it('sees the right number of deps', () => {
    expect(Object.keys(result.stripesDeps)).to.be.an('array').with.lengthOf(2);
  });
  it('lists deps sorted by version', () => {
    expect(result.stripesDeps['@folio/stripes-dep1'][1].version).to.equal('3.4.5');
  });
  it('has icons from the right number of packages', () => {
    expect(Object.keys(result.icons)).to.be.an('array').with.lengthOf(3);
  });
  it('uses icon from the latest version', () => {
    expect(result.icons['@folio/stripes-dep1'].thing.title).to.equal('Thingy');
  });
});

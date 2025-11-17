const modulePaths = require('./module-paths');
const { StripesModuleParser, parseAllModules } = require('./stripes-module-parser');

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
  return function (mod) {
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
      const locateStub = jest.spyOn(modulePaths, 'locateStripesModule').mockReturnValue(false);
      expect(() => {
        new StripesModuleParser(moduleName, moduleConfig, context, aliases);
      }).toThrow(/Unable to locate/);
      locateStub.mockRestore();
    });
  });

  describe('parsing methods', () => {
    let sut;
    let packageJson;
    let locateStub;
    let tryResolveStub;
    let loadModulePackageJsonStub;

    beforeEach(() => {
      mockPackageJson = getMockPackageJson();
      packageJson = mockPackageJson('@folio/users');
      loadModulePackageJsonStub = jest.spyOn(StripesModuleParser.prototype, 'loadModulePackageJson').mockImplementation(mockPackageJson);
      tryResolveStub = jest.spyOn(modulePaths, 'tryResolve').mockReturnValue(true); // Mocks finding all the icon files
      sut = new StripesModuleParser(moduleName, moduleConfig, context, aliases);
      sut.modulePath = '/path/to/module';
    });

    afterEach(() => {
      loadModulePackageJsonStub.mockRestore();
      if (tryResolveStub) tryResolveStub.mockRestore();
      if (locateStub) locateStub.mockRestore();
    });

    describe('parseStripesConfig', () => {
      it('returns a parsed config', () => {
        const result = sut.parseStripesConfig('@folio/users', packageJson);
        expect(result).toEqual(expect.any(Object));
        expect(Object.keys(result)).toEqual(expect.arrayContaining([
          'module', 'getModule', 'description', 'version', 'displayName', 'route', 'welcomePageEntries',
        ]));
      });

      it('applies overrides from tenant config', () => {
        sut.overrideConfig = { displayName: 'something else' };
        const result = sut.parseStripesConfig('@folio/users', packageJson);
        expect(result.displayName).toBe('something else');
      });

      it('assigns getModule function', () => {
        const result = sut.parseStripesConfig('@folio/users', packageJson);
        expect(result.getModule).toEqual(expect.any(Function));
      });
    });

    describe('parseStripesMetadata', () => {
      it('returns metadata', () => {
        const result = sut.parseStripesMetadata(packageJson);
        expect(result).toEqual(expect.any(Object));
        expect(Object.keys(result)).toEqual(expect.arrayContaining([
          'name', 'version', 'description', 'license', 'feedback', 'type', 'shortTitle', 'fullTitle',
          'defaultPopoverSize', 'defaultPreviewWidth', 'helpPage', 'icons', 'welcomePageEntries',
        ]));
      });
    });

    describe('parseModule', () => {
      it('throws StripesBuildError when stripes is missing', () => {
        delete sut.packageJson.stripes;
        expect(() => {
          sut.parseModule();
        }).toThrow(/does not have a "stripes" key/);
      });

      it('throws StripesBuildError when stripes.actsAs is missing', () => {
        delete sut.packageJson.stripes.actsAs;
        expect(() => {
          sut.parseModule();
        }).toThrow(/does not specify stripes\.actsAs/);
      });
    });

    describe('getIconMetadata', () => {
      it('returns icon data by name', () => {
        const result = sut.getIconMetadata(icons);
        expect(result).toEqual(expect.any(Object));
        expect(Object.keys(result)).toEqual(expect.arrayContaining(['one', 'two']));
        expect(result.one).toEqual(expect.objectContaining({
          alt: 'alt for one',
          title: 'a title for one',
        }));
      });

      it('warns when icons are missing', () => {
        sut.getIconMetadata(undefined, true);
        expect(sut.warnings[0]).toMatch(/no icons defined/);
      });

      it('uses icon.fileName for building file paths', () => {
        const result = sut.getIconMetadata(icons);
        expect(result.one).toEqual(expect.objectContaining({
          src: '/path/to/module/icons/oneFile.svg',
        }));
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
        expect(result.one).toEqual(expect.objectContaining({
          src: '/path/to/module/icons/one.svg',
        }));
      });
    });

    describe('buildIconFilePaths', () => {
      it('returns all file variants (high/low)', () => {
        const result = sut.buildIconFilePaths('one');
        expect(result).toEqual(expect.objectContaining({
          high: { src: '/path/to/module/icons/one.svg' },
          low: { src: '/path/to/module/icons/one.png' },
        }));
      });

      it('returns default icon src', () => {
        const result = sut.buildIconFilePaths('one');
        expect(result).toEqual(expect.objectContaining({
          src: '/path/to/module/icons/one.svg',
        }));
      });

      it('does not return paths for missing icons', () => {
        tryResolveStub.mockRestore();
        tryResolveStub = jest.spyOn(modulePaths, 'tryResolve').mockReturnValue(false);
        const result = sut.buildIconFilePaths('one');
        expect(result).toEqual(expect.objectContaining({
          high: { src: '' },
          low: { src: '' },
        }));
      });

      it('warns for missing icons variants', () => {
        tryResolveStub.mockRestore();
        tryResolveStub = jest.spyOn(modulePaths, 'tryResolve').mockReturnValue(false);
        sut.buildIconFilePaths('one');
        expect(sut.warnings[0]).toMatch(/missing file/);
      });
    });

    describe('getWelcomePageEntries', () => {
      it('returns array of welcomePageEntries', () => {
        const parsedIcons = sut.getIconMetadata(icons);
        const result = sut.getWelcomePageEntries(welcomePageEntries, parsedIcons);
        expect(result).toEqual(expect.any(Array));
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(welcomePageEntries[0]);
      });

      it('warns when a missing icon is referenced', () => {
        const parsedIcons = sut.getIconMetadata(icons);
        delete parsedIcons.one;
        sut.getWelcomePageEntries(welcomePageEntries, parsedIcons);
        expect(sut.warnings[0]).toMatch(/no matching stripes.icons/);
      });
    });
  });
});

describe('parseAllModules function', () => {
  describe('module type is "app"', () => {
    let loadModulePackageJsonStub;
    let tryResolveStub;

    beforeEach(() => {
      mockPackageJson = getMockPackageJson();
      loadModulePackageJsonStub = jest.spyOn(StripesModuleParser.prototype, 'loadModulePackageJson').mockImplementation(mockPackageJson);
      tryResolveStub = jest.spyOn(modulePaths, 'tryResolve').mockReturnValue(true); // Mocks finding all the icon files
    });

    afterEach(() => {
      loadModulePackageJsonStub.mockRestore();
      tryResolveStub.mockRestore();
    });

    it('returns config and metadata collections', () => {
      const result = parseAllModules(enabledModules, context, aliases);
      expect(result).toEqual(expect.any(Object));
      expect(Object.keys(result)).toEqual(
        expect.arrayContaining(['config', 'metadata', 'stripesDeps', 'icons', 'warnings', 'lazyImports'])
      );
    });

    it('returns config grouped by stripes type', () => {
      const result = parseAllModules(enabledModules, context, aliases);
      expect(result.config).toEqual(expect.any(Object));
      expect(result.config).toHaveProperty('app');
      expect(result.config.app).toEqual(expect.any(Array));
      expect(result.config.app).toHaveLength(3);
      expect(result.config.app[0]).toEqual(expect.any(Object));
      expect(Object.keys(result.config.app[0])).toEqual(expect.arrayContaining([
        'module', 'getModule', 'description', 'version', 'displayName', 'route', 'welcomePageEntries',
      ]));
    });

    it('returns metadata for each module', () => {
      const result = parseAllModules(enabledModules, context, aliases);
      expect(result.metadata).toEqual(expect.any(Object));
      expect(Object.keys(result.metadata)).toEqual(expect.arrayContaining(
        ['users', 'search', 'developer']
      ));
      expect(result.warnings).toEqual(expect.any(Array));
      expect(result.warnings).toHaveLength(0);
    });

    it('returns warnings for each module', () => {
      tryResolveStub.mockRestore();
      tryResolveStub = jest.spyOn(modulePaths, 'tryResolve').mockReturnValue(false); // Mock missing files
      const result = parseAllModules(enabledModules, context, aliases);
      expect(result.warnings).toEqual(expect.any(Array));
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('module acts as "settings" and "plugin"', () => {
    let loadModulePackageJsonStub;
    let tryResolveStub;

    beforeEach(() => {
      mockPackageJson = getMockPackageJson(['settings', 'plugin']);
      loadModulePackageJsonStub = jest.spyOn(StripesModuleParser.prototype, 'loadModulePackageJson').mockImplementation(mockPackageJson);
      tryResolveStub = jest.spyOn(modulePaths, 'tryResolve').mockReturnValue(true); // Mocks finding all the icon files
    });

    afterEach(() => {
      loadModulePackageJsonStub.mockRestore();
      tryResolveStub.mockRestore();
    });

    it('actsAs settings and plugin produces the expected settings and plugin configs and no app config', () => {
      const result = parseAllModules(enabledModules, context, aliases);
      expect(result.config.app).toEqual(expect.any(Array));
      expect(result.config.app).toHaveLength(0);
      expect(result.config.settings).toEqual(expect.any(Array));
      expect(result.config.settings).toHaveLength(3);
      expect(result.config.plugin).toEqual(expect.any(Array));
      expect(result.config.plugin).toHaveLength(3);
    });
  });
});

describe('integration', () => {
  it('sees the right number of apps', () => {
    const result = parseAllModules({ '@folio/app1': {}, '@folio/app2': {} }, __dirname, aliases);
    expect(result.config.app).toEqual(expect.any(Array));
    expect(result.config.app).toHaveLength(2);
  });

  it('sees the right number of deps', () => {
    const result = parseAllModules({ '@folio/app1': {}, '@folio/app2': {} }, __dirname, aliases);
    expect(Object.keys(result.stripesDeps)).toEqual(expect.any(Array));
    expect(Object.keys(result.stripesDeps)).toHaveLength(2);
  });

  it('lists deps sorted by version', () => {
    const result = parseAllModules({ '@folio/app1': {}, '@folio/app2': {} }, __dirname, aliases);
    expect(result.stripesDeps['@folio/stripes-dep1'][1].version).toBe('3.4.5');
  });

  it('has icons from the right number of packages', () => {
    const result = parseAllModules({ '@folio/app1': {}, '@folio/app2': {} }, __dirname, aliases);
    expect(Object.keys(result.icons)).toEqual(expect.any(Array));
    expect(Object.keys(result.icons)).toHaveLength(3);
  });

  it('uses icon from the latest version', () => {
    const result = parseAllModules({ '@folio/app1': {}, '@folio/app2': {} }, __dirname, aliases);
    expect(result.icons['@folio/stripes-dep1'].thing.title).toBe('Thingy');
  });
});

const expect = require('chai').expect;
const StripesInjectedMFRuntimePlugin = require('../../webpack/stripes-injected-mf-runtime-plugin').default;
const RemoteRuntimePlugin = require('../../webpack/remote-runtime-plugin').default;

const HOST_RUNTIME_PLUGIN_NAME = 'stripes-injected-mf-runtime-plugin';

describe('Module Federation Runtime Plugins', () => {

  describe('StripesInjectedMFRuntimePlugin', () => {
    let plugin;

    beforeEach(() => {
      plugin = StripesInjectedMFRuntimePlugin();
      // Clean up global variables before each test
      delete globalThis.__DEBUG_MISSED_DEPS__;
      delete globalThis.__FEDERATION__;
    });

    afterEach(() => {
      delete globalThis.__DEBUG_MISSED_DEPS__;
      delete globalThis.__FEDERATION__;
    });

    it('should return a plugin object with correct name', () => {
      expect(plugin).to.be.an('object');
      expect(plugin.name).to.equal(HOST_RUNTIME_PLUGIN_NAME);
    });

    it('should have a beforeLoadShare lifecycle method', () => {
      expect(plugin.beforeLoadShare).to.be.a('function');
    });

    describe('beforeLoadShare hook', () => {
      let mockArgs;

      beforeEach(() => {
        mockArgs = {
          origin: { name: 'test-remote' },
          shareInfo: { shareConfig: { requiredVersion: '1.0.0' } },
          pkgName: '@folio/test-package'
        };
        globalThis.__FEDERATION__ = { __INSTANCES__: [] };
      });

      const setupHostWithShared = (shared) => {
        globalThis.__FEDERATION__ = {
          __INSTANCES__: [{
            options: { shared }
          }]
        };
      };

      it('should create __DEBUG_MISSED_DEPS__ global if it does not exist', async () => {
        expect(globalThis.__DEBUG_MISSED_DEPS__).to.be.undefined;

        await plugin.beforeLoadShare(mockArgs);

        expect(globalThis.__DEBUG_MISSED_DEPS__).to.be.an('array');
        expect(globalThis.__DEBUG_MISSED_DEPS__).to.have.lengthOf(0);
      });

      it('should not track anything when no host instance exists', async () => {
        await plugin.beforeLoadShare(mockArgs);

        expect(globalThis.__DEBUG_MISSED_DEPS__).to.have.lengthOf(0);
      });

      it('should record version mismatch in __DEBUG_MISSED_DEPS__', async () => {
        setupHostWithShared({ '@folio/test-package': [{ version: '2.0.0' }] });

        await plugin.beforeLoadShare(mockArgs);

        expect(globalThis.__DEBUG_MISSED_DEPS__).to.have.lengthOf(1);
        expect(globalThis.__DEBUG_MISSED_DEPS__[0]).to.include({
          pkgName: '@folio/test-package',
          hostVersion: '2.0.0',
          remoteApp: 'test-remote'
        });
      });

      it('should track multiple different package mismatches', async () => {
        setupHostWithShared({
          '@folio/test-package': [{ version: '2.0.0' }],
          'react': [{ version: '18.2.0' }]
        });

        await plugin.beforeLoadShare(mockArgs);

        const args2 = {
          origin: { name: 'test-remote' },
          shareInfo: { shareConfig: { requiredVersion: '17.0.0' } },
          pkgName: 'react'
        };

        await plugin.beforeLoadShare(args2);

        expect(globalThis.__DEBUG_MISSED_DEPS__).to.have.lengthOf(2);
      });
    });
  });

  describe('RemoteRuntimePlugin', () => {
    let plugin;

    beforeEach(() => {
      plugin = RemoteRuntimePlugin();
      delete globalThis.__FEDERATION__;
    });

    afterEach(() => {
      delete globalThis.__FEDERATION__;
    });

    describe('beforeInit hook', () => {
      let mockArgs;
      let mockOrigin;
      let registeredPlugins;

      beforeEach(() => {
        registeredPlugins = [];
        mockOrigin = {
          registerPlugins: function (plugins) {
            registeredPlugins = plugins;
          }
        };
        mockArgs = {
          origin: mockOrigin
        };
        globalThis.__FEDERATION__ = { __INSTANCES__: [] };
      });

      const setupHostWithPlugins = (plugins) => {
        globalThis.__FEDERATION__ = {
          __INSTANCES__: [{
            options: { plugins }
          }]
        };
      };

      const createMockHostPlugin = () => ({
        name: HOST_RUNTIME_PLUGIN_NAME,
        beforeLoadShare: function () { }
      });

      it('should return args unmodified when no host instance exists', () => {
        const result = plugin.beforeInit(mockArgs);

        expect(result).to.deep.equal(mockArgs);
      });

      it('should return args unmodified when host instance has no injected plugin', () => {
        setupHostWithPlugins([{ name: 'some-other-plugin' }]);

        const result = plugin.beforeInit(mockArgs);

        expect(result).to.deep.equal(mockArgs);
      });

      it('should register host injected plugin when it exists', () => {
        const mockHostPlugin = createMockHostPlugin();
        setupHostWithPlugins([mockHostPlugin]);

        const result = plugin.beforeInit(mockArgs);

        expect(result).to.deep.equal(mockArgs);
        expect(registeredPlugins).to.have.lengthOf(1);
        expect(registeredPlugins[0]).to.equal(mockHostPlugin);
      });

      it('should call registerPlugins on the remote origin', () => {
        const mockHostPlugin = createMockHostPlugin();
        setupHostWithPlugins([mockHostPlugin]);

        plugin.beforeInit(mockArgs);

        expect(registeredPlugins).to.have.lengthOf(1);
        expect(registeredPlugins[0]).to.equal(mockHostPlugin);
      });

      it('should return the modified args after registering plugin', () => {
        const mockHostPlugin = createMockHostPlugin();
        setupHostWithPlugins([mockHostPlugin]);

        const result = plugin.beforeInit(mockArgs);

        expect(result).to.deep.equal(mockArgs);
        expect(result.origin).to.equal(mockOrigin);
      });
    });
  });
});

const expect = require('chai').expect;
const sinon = require('sinon');
const path = require('path');
// Ensure global test setup (sinon-chai) is applied when mocha is invoked for this single spec
require('./test-setup.spec');

describe('The federate function', function () {
  let fetchStub;
  let webpackModule;
  let webpackStub;
  let WebpackDevServerModule;
  let WebpackDevServerStub;
  let tryResolveStub;
  let buildConfigStub;
  let snakeCaseStub;
  let consoleLogStub;
  let consoleErrorStub;
  let processExitStub;
  let compilerShutdownFn;
  let federate;

  beforeEach(function () {
    // Stub global fetch (used for registry POST/DELETE)
    fetchStub = sinon.stub(global, 'fetch').resolves();

    // Stub webpack (returns a compiler stub)
    webpackModule = require('webpack');

    const compilerStub = {
      hooks: {
        shutdown: {
          tapPromise: sinon.stub().callsFake((name, fn) => {
            // capture shutdown function for later simulation
            compilerShutdownFn = fn;
          })
        }
      }
    };

    // replace webpack module export with a stub function that returns our compiler
    webpackStub = sinon.stub().callsFake((cfg) => compilerStub);
    try {
      require.cache[require.resolve('webpack')].exports = webpackStub;
    } catch (e) {
      // ignore if cannot patch
    }

    // Stub WebpackDevServer constructor
    WebpackDevServerModule = require('webpack-dev-server');

    WebpackDevServerStub = sinon.stub().callsFake((devServerCfg, compiler) => ({
      start: sinon.stub().resolves()
    }));

    // replace the module export on the real webpack-dev-server module (for when federate requires it)
    // Some versions export a class; we attach our stub to the module export
    Object.keys(WebpackDevServerModule).forEach(k => {
      // noop - ensure module is loaded
    });
    // patching the module's export directly (works for common test environment)
    try {
      // In many installs webpack-dev-server exports a function/class; overwrite it safely
      require.cache[require.resolve('webpack-dev-server')].exports = WebpackDevServerStub;
    } catch (e) {
      // ignore if cannot patch
    }

    // Stub module-paths.tryResolve
    const modulePaths = require('../../webpack/module-paths');
    tryResolveStub = sinon.stub(modulePaths, 'tryResolve').returns(path.join(__dirname, 'fixtures', 'package.json'));

    // Stub the build config factory by injecting a fake module into the require cache
    buildConfigStub = sinon.stub().returns({ devServer: {} });
    try {
      const resolved = require.resolve('../../webpack.config.federate.remote');
      require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports: buildConfigStub };
    } catch (e) {
      // ignore if cannot inject
    }

    // Stub snakeCase before requiring federate (so destructured import picks up stub)
    // const lodash = require('lodash');
    // snakeCaseStub = sinon.stub(lodash, 'snakeCase').callsFake((s) => s.replace(/[^a-zA-Z0-9]+/g, '-'));

    // Stub console and process.exit
    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');
    processExitStub = sinon.stub(process, 'exit');

    // Now require the federate module under test after stubs are in place
    delete require.cache[require.resolve('../../webpack/federate')];
    federate = require('../../webpack/federate');
  });

  afterEach(function () {
    // restore any sinon stubs we created in this file
    sinon.restore();

    // Clean up any patched module export
    try {
      // restore webpack-dev-server to original export by reloading module
      delete require.cache[require.resolve('webpack-dev-server')];
      require('webpack-dev-server');
    } catch (e) {
      // ignore
    }
  });

  it('starts federation successfully', async function () {
    const stripesConfig = { okapi: { entitlementUrl: 'http://localhost:3001/registry' } };

    await federate(stripesConfig, { port: 3003 });

    // ensure package.json resolution was tried
    expect(tryResolveStub).to.have.been.calledWith(sinon.match.string);

    // ensure fetch was called to POST to registry
    expect(fetchStub).to.have.been.calledWith('http://localhost:3001/registry', sinon.match.object);

    // ensure webpack and dev server were invoked
    expect(webpackStub).to.have.been.called;
    expect(WebpackDevServerStub).to.have.been.called;

    // ensure console logged the server start
    expect(consoleLogStub).to.have.been.calledWith('Starting remote server on port 3003');
  });

  it('uses default port when not provided', async function () {
    const stripesConfig = { okapi: { entitlementUrl: 'http://localhost:3001/registry' } };

    await federate(stripesConfig);

    expect(consoleLogStub).to.have.been.calledWith('Starting remote server on port 3002');
  });

  it('exits when package.json not found', async function () {
    // make tryResolve return falsy
    const modulePaths = require('../../webpack/module-paths');
    tryResolveStub.returns(false);

    // Make process.exit throw so the function stops executing and we can assert the behaviour
    processExitStub.callsFake(() => { throw new Error('process.exit called'); });

    let thrown;
    try {
      await federate({ okapi: { entitlementUrl: 'http://localhost:3001/registry' } });
    } catch (e) {
      thrown = e;
    }

    expect(thrown).to.be.an('error');
    expect(consoleErrorStub).to.have.been.calledWith('package.json not found');
    expect(processExitStub).to.have.been.called;
  });

  it('exits when registry post fails', async function () {
    fetchStub.rejects(new Error('Network error'));

    await federate({ okapi: { entitlementUrl: 'http://localhost:3001/registry' } });

    expect(consoleErrorStub).to.have.been.calledWith('Registry not found. Please check http://localhost:3001/registry');
    expect(processExitStub).to.have.been.called;
  });

  it('handles shutdown hook (DELETE is called)', async function () {
    const stripesConfig = { okapi: { entitlementUrl: 'http://localhost:3001/registry' } };

    await federate(stripesConfig, { port: 3004 });

    // we captured the shutdown function when compiler.hooks.shutdown.tapPromise was called
    expect(compilerShutdownFn).to.be.a('function');

    // simulate shutdown - it should call fetch with DELETE
    await compilerShutdownFn();

    expect(fetchStub).to.have.been.calledWith('http://localhost:3001/registry', sinon.match({ method: 'DELETE' }));
  });
});

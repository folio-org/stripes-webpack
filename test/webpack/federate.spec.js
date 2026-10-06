import { expect } from 'chai';
import sinon from 'sinon';
import path from 'path';
import { jest } from '@jest/globals';

describe('The federate function', () => {
  let fetchStub;
  let webpackStub;
  let WebpackDevServerStub;
  let tryResolveStub;
  let buildConfigStub;
  let consoleLogStub;
  let consoleErrorStub;
  let processExitStub;
  let compilerShutdownFn;
  let federate;

  beforeEach(async () => {
    jest.resetModules();
    fetchStub = sinon.stub(global, 'fetch').resolves();

    const compilerStub = {
      hooks: {
        shutdown: {
          tapPromise: sinon.stub().callsFake((name, fn) => {
            compilerShutdownFn = fn;
          }),
        },
      },
    };
    webpackStub = sinon.stub().returns(compilerStub);
    WebpackDevServerStub = sinon.stub().callsFake(() => ({ start: sinon.stub().resolves() }));
    tryResolveStub = sinon.stub().returns(path.join(import.meta.dirname, 'fixtures', 'package.json'));
    buildConfigStub = sinon.stub().returns({ devServer: {} });

    jest.unstable_mockModule('webpack', () => ({ default: webpackStub }));
    jest.unstable_mockModule('webpack-dev-server', () => ({ default: WebpackDevServerStub }));
    jest.unstable_mockModule('../../webpack/module-paths.js', () => ({ tryResolve: tryResolveStub }));
    jest.unstable_mockModule('../../webpack.config.federate.remote.js', () => ({ default: buildConfigStub }));

    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');
    processExitStub = sinon.stub(process, 'exit');

    federate = (await import('../../webpack/federate.js')).default;
  });

  it('starts federation successfully', async () => {
    const stripesConfig = { okapi: { discoveryUrl: 'http://localhost:3001/registry' } };

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

  it('uses default port when not provided', async () => {
    const stripesConfig = { okapi: { discoveryUrl: 'http://localhost:3001/registry' } };

    await federate(stripesConfig);

    expect(consoleLogStub).to.have.been.calledWith('Starting remote server on port 3002');
  });

  it('exits when package.json not found', async () => {
    // make tryResolve return falsy
    tryResolveStub.returns(false);

    // Make process.exit throw so the function stops executing and we can assert the behaviour
    processExitStub.callsFake(() => { throw new Error('process.exit called'); });

    let thrown;
    try {
      await federate({ okapi: { discoveryUrl: 'http://localhost:3001/registry' } });
    } catch (e) {
      thrown = e;
    }

    expect(thrown).to.be.an('error');
    expect(consoleErrorStub).to.have.been.calledWith('package.json not found');
    expect(processExitStub).to.have.been.called;
  });

  it('exits when registry post fails', async () => {
    fetchStub.rejects(new Error('Network error'));

    await federate({ okapi: { discoveryUrl: 'http://localhost:3001/registry' } });

    expect(consoleErrorStub).to.have.been.calledWith(sinon.match(/^Local discovery not found/));
    expect(processExitStub).to.have.been.called;
  });

  it('handles shutdown hook (DELETE is called)', async () => {
    const stripesConfig = { okapi: { discoveryUrl: 'http://localhost:3001/registry' } };

    await federate(stripesConfig, { port: 3004 });

    // we captured the shutdown function when compiler.hooks.shutdown.tapPromise was called
    expect(compilerShutdownFn).to.be.a('function');

    // simulate shutdown - it should call fetch with DELETE
    await compilerShutdownFn();

    expect(fetchStub).to.have.been.calledWith('http://localhost:3001/registry', sinon.match({ method: 'DELETE' }));
  });
});

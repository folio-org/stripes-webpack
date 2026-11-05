import { describe, it, before, after } from 'node:test';
import { expect } from 'chai';

import registryServer from '../../webpack/registryServer.js';

describe('The registry server', function () {
  const base = 'http://localhost:3001';

  let server;

  before(async () => {
    server = registryServer.start(base, 'diku');
    await new Promise(resolve => server.on('listening', resolve));
  });

  after(() => new Promise(resolve => server.close(resolve)));

  const send = (base, method, path, body) => fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });

  it('returns the registry with CORS headers', async function () {
    const res = await send(base, 'GET', '/registry');
    const json = await res.json();
    expect(res.status).to.equal(200);
    expect(res.headers.get('access-control-allow-origin')).to.equal('*');
    expect(json.discovery.map(r => r.name)).to.include('folio_stripes');
  });

  it('returns the registry from the entitlements route for the tenant', async function () {
    const res = await send(base, 'GET', '/registry/entitlements/diku/applications');
    expect(res.status).to.equal(200);
    expect((await res.json()).discovery).to.be.an('array');
  });

  it('adds a remote once and removes it', async function () {
    const remote = { name: 'folio_test', id: 'folio_test-1.0' };

    await send(base, 'POST', '/registry', remote);
    await send(base, 'POST', '/registry', remote);
    let json = await (await send(base, 'GET', '/registry')).json();
    expect(json.discovery.filter(r => r.name === 'folio_test')).to.have.lengthOf(1);

    const res = await send(base, 'DELETE', '/registry', remote);
    expect(await res.text()).to.equal('Remote folio_test removed');
    json = await (await send(base, 'GET', '/registry')).json();
    expect(json.discovery.map(r => r.name)).to.not.include('folio_test');
  });

  it('renders the registry as html at /code', async function () {
    const res = await send(base, 'GET', '/code');
    expect(res.headers.get('content-type')).to.match(/text\/html/);
    expect(await res.text()).to.match(/^<pre>/);
  });

  it('answers preflight requests', async function () {
    const res = await send(base, 'OPTIONS', '/registry');
    expect(res.status).to.equal(204);
  });

  it('rejects invalid JSON and unknown routes', async function () {
    const bad = await fetch(`${base}/registry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{nope' });
    expect(bad.status).to.equal(400);
    const missing = await send(base, 'GET', '/nope');
    expect(missing.status).to.equal(404);
  });
});

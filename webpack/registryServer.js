const express = require('express');
const cors = require('cors');

// Registry data
const registry = {
  discovery: [{
    id: 'folio_stripes-1.0',
    version: '1.0',
    name: 'folio_stripes',
    url: 'http://localhost:3000'
  }]
};

const registryServer = {
  start: (url, tenant = 'diku') => {
    const app = express();

    app.use(express.json());
    app.use(cors());

    // add/update remote to registry
    app.post('/registry', (req, res) => {
      const metadata = req.body;
      const { name } = metadata;

      if (registry.discovery.findIndex(r => r.name === name) === -1) {
        registry.discovery.push(metadata)
      }

      res.status(200).send(`Remote ${name} metadata updated`);
    });

    // return entire registry for machines
    app.get('/registry', (_, res) => res.json(registry));

    app.get(`/registry/entitlements/${tenant}/applications`, (_, res) => res.json(registry));

    // return entire registry for humans
    app.get('/code', (_, res) => res.send(`<pre>${JSON.stringify(registry, null, 2)}</pre>`));

    app.delete('/registry', (req, res) => {
      const metadata = req.body;
      const { name } = metadata;

      registry.discovery = registry.discovery.filter(r => r.name !== name);

      res.status(200).send(`Remote ${name} removed`);
    });

    const port = new URL(url).port || 3001;
    app.listen(port, () => {
      console.log('Starting registry server at http://localhost:3001');
    });
  }
};

module.exports = registryServer;

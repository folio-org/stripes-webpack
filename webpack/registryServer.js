const express = require('express');
const cors = require('cors');

// Registry data
const registry = { remotes: {} };

const registryServer = {
  start: () => {
    const app = express();

    app.use(express.json());
    app.use(cors());

    // add/update remote to registry
    app.post('/registry', (req, res) => {
      const metadata = req.body;
      const { name } = metadata;

      registry.remotes[name] = metadata;
      res.status(200).send(`Remote ${name} metadata updated`);
    });

    // return entire registry
    app.get('/registry', (_, res) => res.json(registry));

    app.delete('/registry', (req, res) => {
      const metadata = req.body;
      const { name } = metadata;
      delete registry.remotes[name];

      res.status(200).send(`Remote ${name} removed`);
    });

    app.listen(3001, () => {
      console.log('Starting registry server at http://localhost:3001');
    });
  }
};

module.exports = registryServer;

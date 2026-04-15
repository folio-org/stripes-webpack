// Main entry point for Stripes application
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import the Stripes UI application
import { okapi, modules, config, branding } from 'virtual:stripes-config';
import App from '@folio/stripes-ui';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App
      okapi={okapi}
      modules={modules}
      config={config}
      branding={branding}
    />
  </React.StrictMode>
);

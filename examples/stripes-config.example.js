// Example Stripes configuration loader
// This shows how to pass Stripes configuration to Vite

export const stripesConfig = {
  // Okapi (backend) configuration
  okapi: {
    url: import.meta.env.VITE_OKAPI_URL || 'http://localhost:9130',
    tenant: import.meta.env.VITE_OKAPI_TENANT || 'supertenant',
  },

  // UI module configuration
  modules: {
    // Example: '@folio/users': { route: '/users' }
  },

  // Branding configuration
  branding: {
    logo: {
      src: './logo.png',
      alt: 'FOLIO',
    },
    favicon: {
      src: './favicon.ico',
    },
    primaryColor: '#007acc',
    logo: {
      src: './images/logo.png',
      alt: 'FOLIO Logo',
    },
  },

  // Application configuration
  config: {
    // Translation namespace
    i18n: {
      ns: ['common', 'ui-components'],
      defaultNS: 'common',
    },

    // Session configuration
    session: {
      timeout: 1800000, // 30 minutes
    },

    // Feature flags
    features: {
      // Example: newDashboard: true,
    },
  },
};

export default stripesConfig;

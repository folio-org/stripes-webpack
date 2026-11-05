// These default branding values are used when no branding is present in stripes.config.js
// Default src are prefixed with '@folio/stripes-core' so they can be imported
// and processed through the webpack loaders from the stripes-core in use.
export default {
  logo: {
    src: `${import.meta.dirname}/folio-logo.svg`,
    alt: 'FOLIO',
  },
  favicon: {
    src: `${import.meta.dirname}/favicon.svg`,
  },
};

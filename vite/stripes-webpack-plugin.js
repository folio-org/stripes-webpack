// Vite plugin equivalent of stripes-webpack-plugin.js
// Handles Stripes-specific build configuration

export default function StripesWebpackPlugin(options = {}) {
  return {
    name: 'stripes-webpack-plugin',
    
    apply: 'build',
    
    config(config, env) {
      // Apply Stripes-specific build optimizations
      return {
        build: {
          rollupOptions: {
            output: {
              manualChunks: {
                stripes: ['@folio/stripes-core', '@folio/stripes-ui'],
              },
            },
          },
        },
      };
    },
    
    configResolved(resolvedConfig) {
      // Store resolved config for later use
      this.config = resolvedConfig;
    },
  };
}

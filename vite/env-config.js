// Vite environment configuration loader
// This helps load Stripes-specific environment variables

import fs from 'fs';
import path from 'path';

export const getEnvConfig = () => {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    VITE_API_URL: process.env.VITE_API_URL,
    VITE_OKAPI_URL: process.env.VITE_OKAPI_URL,
    VITE_PORT: process.env.VITE_PORT || 3000,
    VITE_HOST: process.env.VITE_HOST || 'localhost',
  };
};

export default getEnvConfig();

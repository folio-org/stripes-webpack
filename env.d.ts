/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_OKAPI_URL?: string;
  readonly VITE_PORT?: string;
  readonly VITE_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'virtual:stripes-config' {
  export const okapi: Record<string, any>;
  export const modules: Record<string, any>;
  export const branding: Record<string, any>;
  export const config: Record<string, any>;
}

declare module '*.csv' {
  const content: Record<string, any>[];
  export default content;
}

declare module '*.handlebars' {
  const content: string;
  export default content;
}

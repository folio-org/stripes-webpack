# Change history for stripes-webpack

## 4.3.0 IN PROGRESS

* Upgrade `css-minimizer-webpack-plugin` to `v4`. Refs STRWEB-72.
* Remove `babel-plugin-lodash`. Refs STRWEB-73.
* Replace babel loader with esbuild loader. Refs STRWEB-76.
* Do not strip `data-test` attributes from production builds. Refs STRWEB-75.
* Avoid buggy `postcss-loader` `v7.2.0` release. Refs STRWEB-79.
* Remove `css-minimizer-webpack-plugin`. Refs STRWEB-82.

## [4.2.0](https://github.com/folio-org/stripes-webpack/tree/v4.2.0) (2023-01-30)
[Full Changelog](https://github.com/folio-org/stripes-webpack/compare/v4.1.2...v4.2.0)

* Point to `@folio/stripes-ui` instead of `@folio/stripes-core` as the index entry. Refs STRIPES-820.
* Register `@folio/stripes-ui` with `stripes-duplicate` and `stripes-translations` plugins. Refs STRWEB-65.
* Remove `enhanced-resolve` resolutions entry. Refs STRWEB-62.
* Upgrade `postcss` dependencies to latest. Refs. STRWEB-68.

## [4.1.2](https://github.com/folio-org/stripes-webpack/tree/v4.1.2) (2022-11-23)
[Full Changelog](https://github.com/folio-org/stripes-webpack/compare/v4.1.1...v4.1.2)

* Avoid `enhanced-resolve` `~5.11.0` due to incompatibilities with `webpack-virtual-config`. Refs STRWEB-61.

## [4.1.1](https://github.com/folio-org/stripes-webpack/tree/v4.1.1) (2022-11-02)
[Full Changelog](https://github.com/folio-org/stripes-webpack/compare/v4.1.0...v4.1.1)

* Filter out test files from TS repos when building. Refs STRWEB-60.

## [4.1.0](https://github.com/folio-org/stripes-webpack/tree/v4.1.0) (2022-10-11)
[Full Changelog](https://github.com/folio-org/stripes-webpack/compare/v4.0.0...v4.1.0)

* Fix TypeScript configuration a little more. Replace ES6 with ESNext. Refs STRWEB-54.
* Support transpilation without relying on `STRIPES_TRANSPILE_TOKENS`. Refs STRWEB-49.
* Bump `favicons` and `favicons-webpack-plugin` to avoid security vulnerabilities. Refs STRWEB-50.

## [4.0.0](https://github.com/folio-org/stripes-webpack/tree/v4.0.0) (2022-06-14)
[Full Changelog](https://github.com/folio-org/stripes-webpack/compare/v3.0.3...v4.0.0)

* Migrate from react-hot-loader to react-refresh. Refs STRWEB-27.
* `autoprefixer` and `postcss` versions are now compatible. Refs STRWEB-46.
* Migrate to current `add-asset-html-plugin` to avoid CVE-2020-28469. Refs STRWEB-28.
* Omit last traces of (unused) `react-githubish-mentions`. Refs STRWEB-41.
* Fix TypeScript configuration. Refs STRWEB-54.
* BREAKING: Actually, there are no breaking changes. Lazy loading went on in #42 and off in #69. Refs STRWEB-30, STRWEB-55.

## [3.0.3](https://github.com/folio-org/stripes-webpack/tree/v3.0.3) (2022-02-10)
[Full Changelog](https://github.com/folio-org/stripes-webpack/compare/v3.0.2...v3.0.3)

* Avoid broken `@cerner/duplicate-package-checker-webpack-plugin` `v2.2.0` which introduces new node version restrictions. Refs STRWEB-35.

## [3.0.2](https://github.com/folio-org/stripes-webpack/tree/v3.0.2) (2022-02-08)
[Full Changelog](https://github.com/folio-org/stripes-webpack/compare/v2.0.0...v3.0.2)

* Update webpack to v5. Refs STRWEB-4.
* Dependency cleanup. Refs STRWEB-31.
* Alias Mocha to reduce console noise. Refs STRWEB-32.
* Fix source maps. Fixes STRWEB-34.

## [2.0.0](https://github.com/folio-org/stripes-webpack/tree/v2.0.0) (2021-09-24)
[Full Changelog](https://github.com/folio-org/stripes-webpack/compare/v1.3.0...v2.0.0)

* Lock onto `optimize-css-assets-webpack-plugin` `5.0.6` to avoid `postcss` `v8`. Fixes STRWEB-19.
* Add `loose` to `plugin-proposal-private-property-in-object`. Fixes STRWEB-21.
* Export babel config options for consumption by other modules. Refs STRWEB-22, STRIPES-742, STRIPES-757.
* Setup babel-plugin-lodash correctly. Fixes STRWEB-20.
* Upgrade PostCSS dependency stack. Refs STRWEB-23.
* Conditionally inject shared style aliases based on development context. Refs STRWEB-23, STCLI-183.
* Include `react` `v17` in the peer-deps. Refs STRWEB-25.

## [1.3.0](https://github.com/folio-org/stripes-webpack/tree/v1.3.0) (2021-06-08)
[Full Changelog](https://github.com/folio-org/stripes-webpack/compare/v1.2.0...v1.3.0)

* Correctly specify peer-dependencies. Refs STRWEB-11.
* Replace unmaintained `awesome-typescript-loader` with `ts-loader`. Refs STRWEB-10.
* Some babel plugins must be configured consistently. Refs STRWEB-12.
* Introduce the STRIPES_TRANSPILE_TOKENS environment variable which includes a space delimited list of strings (typically namespaces) to use in addition to "@folio" to determine if something needs Stripes-flavoured transpilation. Fixes STRWEB-13.
* Depend on `optimize-css-assets-webpack-plugin` `^5.0.6` to avoid (reverted) breaking changes in `5.0.5`. Refs STRWEB-15.

## [1.2.0](https://github.com/folio-org/stripes-webpack/tree/v1.2.0) (2021-04-12)
[Full Changelog](https://github.com/folio-org/stripes-webpack/compare/v1.1.0...v1.2.0)

* Add support for new jsx transform. Refs STRWEB-5.
* If translations exist in a `/compiled` subdirectory, then they will be preferred as the translations to use in the final bundle. Refs STCLI-158.
* Ignore non-file entries when reading the `translations/...` directory. Refs STRWEB-7.
* Add support for loading CSV files. Fixes STRWEB-8.

## [1.1.0](https://github.com/folio-org/stripes-webpack/tree/v1.1.0) (2021-02-03)

* Remove support for `hardsource-webpack-plugin`. Refs STCOR-421, STCOR-510.
* Add `locateCssVariables` to `postcss-loader` loader. Refs STCOR-511.

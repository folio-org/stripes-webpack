/* eslint-disable */
// karma-mocha has already loaded mocha and installed its BDD globals in the browser.
// mocha >= 11 no longer ships a bundle that webpack can consume (mocha-es2018.js is gone;
// its ESM sources import `node:` modules), so karma.conf.js aliases `mocha` to this file.
const g = globalThis;

export const {
  after, afterEach, before, beforeEach, context, describe, it, specify,
  xcontext, xdescribe, xit, xspecify, suite, test, setup, teardown,
  suiteSetup, suiteTeardown, run,
} = g;

export default g.Mocha;

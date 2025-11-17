// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');

module.exports = {
  coverageDirectory: './artifacts/coverage-jest/',
  coverageReporters: ['lcov'],
  reporters: ['jest-junit', 'default'],
  "testMatch": [
    "**/**/*.spec.js",
    "**/**/*.test.js",
  ],
  testPathIgnorePatterns: ['/node_modules/', '/test/bigtest/', '/test/ui-testing/'],

  "testEnvironment": "node",
  "transform": {
    "^.+\\.js$": [
      "babel-jest",
      {
        "presets": [
          "@babel/preset-env"
        ]
      }
    ]
  },
  "setupFilesAfterEnv": [
  ]
};


// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharedConfig = require('./jest.config');

module.exports = {
  ...sharedConfig,
  coverageDirectory: 'coverage',
  testRegex: '.*\\.spec\\.ts$',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!*/node_modules/**',
    '!<rootDir>/src/main.ts',
  ],
};

const esModules = ['lodash-es'].join('|');

module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'jsx', 'json', 'vue'],
  transform: { '^.+\\.(ts|js|jsx)?$': 'babel-jest' },
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
};

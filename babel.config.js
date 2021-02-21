const esModules = ['lodash-es'].join('|');

module.exports = {
  ignore: [`/node_modules/(?!${esModules})`],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: true,
        },
      },
    ],
    '@babel/typescript',
  ],
  plugins: ['@babel/plugin-proposal-class-properties', '@babel/proposal-object-rest-spread'],
};

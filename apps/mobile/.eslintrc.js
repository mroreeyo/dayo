// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  overrides: [
    {
      files: ['*.js'],
      env: { node: true },
    },
  ],
};

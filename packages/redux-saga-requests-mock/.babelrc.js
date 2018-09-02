module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: process.env.BABEL_ENV === 'es' ? false : 'commonjs',
        exclude: ['coverage', 'test'].includes(process.env.BABEL_ENV)
          ? ['transform-regenerator']
          : [],
      },
    ],
  ],
  plugins: [
    process.env.BABEL_ENV === 'coverage' && 'istanbul',
    ['@babel/plugin-proposal-object-rest-spread', { loose: true }],
  ].filter(Boolean),
};

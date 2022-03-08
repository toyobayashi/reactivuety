module.exports = {
  // output: {
  //   doc: false
  // },
  rollupGlobals: {
    react: 'React'
  },
  resolveOnly: [/^(?!(react)).*?$/],
  bundleOnly: ['umd', 'cjs', { type: 'esm-bundler', minify: false }],
  bundleDefine: {
    __VERSION__: JSON.stringify(require('./package.json').version)
  }
}

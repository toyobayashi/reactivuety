module.exports = {
  // output: {
  //   doc: false
  // },
  rollupGlobals: {
    react: 'React',
    '@vue/reactivity': 'VueReactivity'
  },
  resolveOnly: [/^(?!(react)|(@vue\/reactivity)).*?$/],
  bundleOnly: ['umd', 'cjs', { type: 'esm-bundler', minify: false }],
  bundleDefine: {
    __VERSION__: JSON.stringify(require('./package.json').version)
  }
}

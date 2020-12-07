module.exports = {
  // output: {
  //   doc: false
  // },
  rollupGlobals: {
    react: 'React',
    '@vue/reactivity': 'VueReactivity'
  },
  resolveOnly: [/^(?!(react)|(@vue\/reactivity)).*?$/]
}

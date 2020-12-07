const path = require('path')

module.exports = {
  configureWebpack: {
    web (config) {
      config.resolve.modules = ['node_modules', path.join(__dirname, 'node_modules')]
    }
  }
}

'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/reactivuety.cjs.min.js')
} else {
  module.exports = require('./dist/reactivuety.cjs.js')
}

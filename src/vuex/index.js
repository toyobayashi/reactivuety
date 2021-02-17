import { Store, createStore } from './store'
import { storeKey, useStore } from './injectKey'
import { createLogger } from './plugins/logger'

export default {
  version: '__VUEX_VERSION__',
  Store,
  storeKey,
  createStore,
  useStore,
  createLogger
}

export {
  Store,
  storeKey,
  createStore,
  useStore,
  createLogger
}

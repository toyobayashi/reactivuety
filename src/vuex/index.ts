import { Store, createStore } from './store'
import { storeKey, useStore } from './injectKey'
import { createLogger, LoggerOption } from './plugins/logger'

export * from './store'

export const vuexVersion: string = '__VUEX_VERSION__'

export default {
  vuexVersion,
  Store,
  storeKey,
  createStore,
  useStore,
  createLogger
}


export {
  storeKey,
  useStore,
  createLogger,
  LoggerOption
}

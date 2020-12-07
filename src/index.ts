/**
 * Use vue composition API with react.
 *
 * @packageDocumentation
 */

export {
  computed
} from './core/apiComputed'

export {
  nextTick
} from './core/scheduler'

export {
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onUnmounted,
  onUpdated,
  WrappedHook,
  DebuggerHook
} from './core/apiLifecycle'

export {
  ref,
  shallowRef
} from './ref'

export {
  useForceUpdate
} from './useForceUpdate'

export {
  useSetup
} from './useSetup'

export {
  watch,
  watchEffect,
  InvalidateCbRegistrator,
  MapSources,
  WatchCallback,
  WatchEffect,
  WatchOptionsBase,
  WatchSource,
  WatchOptions,
  WatchStopHandle
} from './core/apiWatch'

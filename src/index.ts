/**
 * Use vue composition API with react.
 *
 * @packageDocumentation
 */

export {
  computed
} from './core/apiComputed'

export {
  defineComponent
} from './core/apiDefineComponent'

export {
  AsyncComponentResolveResult,
  AsyncComponentLoader,
  AsyncComponentOptions,
  defineAsyncComponent
} from './core/apiAsyncComponent'

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
  createSetupHook,
  SetupFunction,
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

export {
  Input
} from './components/Input'

export {
  Textarea
} from './components/Textarea'

export {
  Select,
  Option
} from './components/Select'

export {
  VModelProps,
  VModelPropsWithLazy,
  CheckboxProps
} from './dom/useVModel'

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
  inject,
  provide,
  InjectionKey
} from './core/apiInject'

export {
  ErrorTypes,
  ErrorCodes,
  setGlobalErrorHandler
} from './core/errorHandling'

export {
  nextTick
} from './core/scheduler'

export {
  LifecycleHooks
} from './core/component'

export {
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onErrorCaptured,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onUnmounted,
  onUpdated,
  WrappedHook,
  DebuggerHook,
  ErrorCapturedHook
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

/** @public */
export const version: string = __VERSION__

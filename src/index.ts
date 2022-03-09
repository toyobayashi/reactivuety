/**
 * Use vue composition API with react.
 *
 * @packageDocumentation
 */

export {
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  computed,
  inject,
  provide,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onErrorCaptured,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onUnmounted,
  onUpdated,

  // core
  reactive,
  readonly,
  // utilities
  unref,
  proxyRefs,
  isRef,
  toRef,
  toRefs,
  isProxy,
  isReactive,
  isReadonly,
  isShallow,
  // advanced
  customRef,
  triggerRef,
  shallowReactive,
  shallowReadonly,
  markRaw,
  toRaw,
  // effect
  effect,
  stop,
  ReactiveEffect,
  // effect scope
  effectScope,
  EffectScope,
  getCurrentScope,
  onScopeDispose,
  getCurrentInstance
} from '@vue/runtime-core'

export {
  defineComponent,
  DefineComponentOptions
} from './core/apiDefineComponent'

export {
  defineAsyncComponent,
  AsyncComponentLoader,
  AsyncComponentOptions,
  AsyncComponentResolveResult
} from './core/apiAsyncComponent'

export {
  ref,
  shallowRef
} from './ref'

export {
  createSetupHook,
  SetupFunction,
  SetupReturnType,
  useSetup,
  RenderFunction
} from './useSetup'

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

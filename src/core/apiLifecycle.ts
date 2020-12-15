import { DebuggerEvent, pauseTracking, resetTracking } from '@vue/reactivity'
import { invokeArrayFns } from '@vue/shared'
import { LifecycleHooks, ComponentInternalInstance, currentInstance, setCurrentInstance, getCurrentInstance } from './component'
import { callWithAsyncErrorHandling } from './errorHandling'

/** @public */
export type WrappedHook = (...args: any[]) => any

export function injectHook<
  H extends { (...args: any[]): any; __weh?: WrappedHook }
> (
  type: LifecycleHooks,
  hook: H,
  target: ComponentInternalInstance | null = currentInstance,
  prepend: boolean = false
): WrappedHook | null {
  if (target) {
    const hooks = target[type] ?? (target[type] = [])

    const wrappedHook =
      hook.__weh ??
      (hook.__weh = (...args: any[]): any[] | undefined => {
        if (target.isUnmounted) {
          return
        }
        // disable tracking inside all lifecycle hooks
        // since they can potentially be called inside effects.
        pauseTracking()
        // Set currentInstance during hook invocation.
        // This assumes the hook does not synchronously trigger other hooks, which
        // can only be false when the user does something really funky.
        setCurrentInstance(target)
        const res = callWithAsyncErrorHandling(hook, target, type, args)
        setCurrentInstance(null)
        resetTracking()
        return res
      })
    if (prepend) {
      hooks.unshift(wrappedHook)
    } else {
      hooks.push(wrappedHook)
    }
    return wrappedHook
  } else if (__DEV__) {
    console.warn(
      `Lifecycle hook "${type}" is called when there is no active component instance to be ` +
        'associated with. ' +
        'Lifecycle injection APIs can only be used during execution of setup().'
    )
  }
  return null
}

export const createHook = <T extends (...args: any[]) => any = () => any>(
  lifecycle: LifecycleHooks
) => (hook: T) => injectHook(lifecycle, hook, getCurrentInstance())

/** @public */
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
/** @public */
export const onMounted = createHook(LifecycleHooks.MOUNTED)
/** @public */
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
/** @public */
export const onUpdated = createHook(LifecycleHooks.UPDATED)
/** @public */
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
/** @public */
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)
/** @public */
export type DebuggerHook = (e: DebuggerEvent) => void
/** @public */
export type ErrorCapturedHook = (err: unknown, info: string) => boolean | undefined
/** @public */
export const onRenderTriggered = createHook<DebuggerHook>(LifecycleHooks.RENDER_TRIGGERED)
/** @public */
export const onRenderTracked = createHook<DebuggerHook>(LifecycleHooks.RENDER_TRACKED)
/** @public */
export const onErrorCaptured = createHook<ErrorCapturedHook>(LifecycleHooks.ERROR_CAPTURED)

export function invokeLifecycle (target: ComponentInternalInstance, type: LifecycleHooks, arg?: any): void {
  const methods = target[type]
  if (!methods || methods.length === 0) return
  invokeArrayFns(methods, arg)
}

export function clearAllLifecycles (target: ComponentInternalInstance): void {
  const lifecycles = [
    LifecycleHooks.BEFORE_MOUNT,
    LifecycleHooks.MOUNTED,
    LifecycleHooks.BEFORE_UPDATE,
    LifecycleHooks.UPDATED,
    LifecycleHooks.BEFORE_UNMOUNT,
    LifecycleHooks.UNMOUNTED,
    LifecycleHooks.RENDER_TRIGGERED,
    LifecycleHooks.RENDER_TRACKED,
    LifecycleHooks.ERROR_CAPTURED
  ]

  for (let i = 0; i < lifecycles.length; i++) {
    if (target[lifecycles[i]]) {
      target[lifecycles[i]]!.length = 0
      target[lifecycles[i]] = null
    }
  }
}

import {
  effect,
  effectScope,
  reactive,
  readonly,
  EffectScope,
  getCurrentInstance,
  // ComponentInternalInstance,
  nextTick,
  // @ts-expect-error
  setCurrentInstance,
  watch,
  proxyRefs,
  ShallowUnwrapRef
} from '@vue/runtime-core'
import { PropsWithChildren, ReactElement, useCallback, useEffect, useRef, ForwardedRef } from 'react'
import { InternalInstance, LifecycleHooks, invokeLifecycle, clearAllLifecycles } from './lifecycle'
import { useForceUpdate } from './useForceUpdate'

/** @public */
export type RenderFunction = (ref: ForwardedRef<any>) => ReactElement | null

/** @public */
export type SetupFunction<P, R extends RenderFunction | object> = (props: Readonly<PropsWithChildren<P>>) => R

/** @public */
export type SetupReturnType<Setup> = Setup extends (...args: any[]) => infer R
  ? R extends (...args: any[]) => ReactElement | null
    ? R
    : R extends object
      ? ShallowUnwrapRef<R>
      : R
  : never

/** @public */
export function useSetup<P, Setup extends SetupFunction<P, RenderFunction | object>> (setup: Setup, props: PropsWithChildren<P>): SetupReturnType<Setup> {
  if (typeof setup !== 'function') {
    throw new TypeError('setup is not a function')
  }
  const forceUpdate = useForceUpdate()

  const scope = useRef<EffectScope>()
  if (!scope.current) {
    scope.current = effectScope()
  }

  const parent = getCurrentInstance()

  const instanceRef = useRef<InternalInstance>()

  const updateProps: { (): void; __called?: boolean } = useCallback(() => {
    if (instanceRef.current) {
      const currentKeys = new Set(Object.keys(instanceRef.current.props))
      const keys = Object.keys(props)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        instanceRef.current.props[key] = (props as any)[key]
        currentKeys.delete(key)
      }
      const it = currentKeys.values()
      let result: IteratorResult<string, any>
      while (true) {
        result = it.next()
        if (result.done) {
          break
        }
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete instanceRef.current.props[result.value]
      }
    }
  }, [props])

  if (!updateProps.__called) {
    updateProps()
    updateProps.__called = true
  }

  if (!instanceRef.current) {
    const updateCallback = (): void => {
      invokeLifecycle(instanceRef.current!, LifecycleHooks.BEFORE_UPDATE)
      forceUpdate()
      void nextTick(() => {
        invokeLifecycle(instanceRef.current!, LifecycleHooks.UPDATED)
      })
    }

    const reactiveProps = reactive({ ...props })
    const readonlyProps = readonly(reactiveProps)
    instanceRef.current = {
      scope: scope.current,
      setupState: null!,
      render: null,
      props: reactiveProps,
      parent: parent as InternalInstance | null,
      provides: parent ? (parent as any).provides : {},
      isMounted: false,
      isUnmounted: false,
      [LifecycleHooks.BEFORE_MOUNT]: null,
      [LifecycleHooks.MOUNTED]: null,
      [LifecycleHooks.BEFORE_UPDATE]: null,
      [LifecycleHooks.UPDATED]: null,
      [LifecycleHooks.BEFORE_UNMOUNT]: null,
      [LifecycleHooks.UNMOUNTED]: null,
      [LifecycleHooks.RENDER_TRACKED]: null,
      [LifecycleHooks.RENDER_TRIGGERED]: null,
      [LifecycleHooks.ERROR_CAPTURED]: null
    }
    setCurrentInstance(instanceRef.current)
    let ret: any
    try {
      ret = scope.current.run(() => setup(readonlyProps as any))!
    } catch (err) {
      scope.current.stop()
      scope.current = undefined
      clearAllLifecycles(instanceRef.current)
      instanceRef.current = undefined
      throw err
    }
    if (typeof ret === 'function') {
      let _args: any[] = []
      const runner = scope.current.run(() => effect(() => ret(..._args), {
        lazy: true,
        scope: scope.current!,
        scheduler: () => {
          void nextTick(updateCallback)
        },
        onTrack (e) {
          invokeLifecycle(instanceRef.current!, LifecycleHooks.RENDER_TRACKED, e)
        },
        onTrigger (e) {
          invokeLifecycle(instanceRef.current!, LifecycleHooks.RENDER_TRIGGERED, e)
        }
      }))
      invokeLifecycle(instanceRef.current, LifecycleHooks.BEFORE_MOUNT)
      instanceRef.current.render = function (...args: any[]): any {
        _args = args
        const r = scope.current!.run(() => runner!())
        _args = []
        return r
      }
    } else {
      scope.current.run(() => {
        watch(() => ret, () => {
          void nextTick(updateCallback)
        }, {
          deep: true,
          onTrack (e) {
            invokeLifecycle(instanceRef.current!, LifecycleHooks.RENDER_TRACKED, e)
          },
          onTrigger (e) {
            invokeLifecycle(instanceRef.current!, LifecycleHooks.RENDER_TRIGGERED, e)
          }
        })
      })
      invokeLifecycle(instanceRef.current, LifecycleHooks.BEFORE_MOUNT)
      instanceRef.current.setupState = proxyRefs(ret)
    }
  }

  useEffect(() => {
    instanceRef.current!.isMounted = true
    instanceRef.current!.isUnmounted = false
    invokeLifecycle(instanceRef.current!, LifecycleHooks.MOUNTED)
    return () => {
      invokeLifecycle(instanceRef.current!, LifecycleHooks.BEFORE_UNMOUNT)
      scope.current!.stop()
      scope.current = undefined
      invokeLifecycle(instanceRef.current!, LifecycleHooks.UNMOUNTED)
      clearAllLifecycles(instanceRef.current!)
      instanceRef.current!.isMounted = false
      instanceRef.current!.isUnmounted = true
    }
  }, [])

  return instanceRef.current.render ?? instanceRef.current.setupState
}

/** @public */
export function createSetupHook<P, Setup extends SetupFunction<P, RenderFunction | object>> (setup: Setup): (props: PropsWithChildren<P>) => SetupReturnType<Setup> {
  if (typeof setup !== 'function') {
    throw new TypeError('setup is not a function')
  }
  return function (props) {
    return useSetup(setup, props)
  }
}

import {
  effect,
  effectScope,
  shallowReactive,
  shallowReadonly,
  getCurrentInstance,
  // ComponentInternalInstance,
  nextTick,
  // @ts-expect-error
  setCurrentInstance, unsetCurrentInstance, queuePreFlushCb,
  watch,
  proxyRefs,
  ShallowUnwrapRef,
  DebuggerEvent
  // queuePostFlushCb,
} from '@vue/runtime-core'
import { PropsWithChildren, ReactElement, useState, useEffect, useRef, ForwardedRef } from 'react'
import { InternalInstance, LifecycleHooks, invokeLifecycle, clearAllLifecycles } from './lifecycle'

function resetParentInstance (parent: InternalInstance | null): void {
  if (parent) {
    setCurrentInstance(parent)
  } else {
    unsetCurrentInstance()
  }
}

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
  const forceUpdate = useState<{}>()[1]

  const instanceRef = useRef<InternalInstance>()

  useEffect(() => {
    if (instanceRef.current) {
      const keys = Object.keys(props)
      for (let i = 0; i < keys.length; ++i) {
        const key = keys[i]
        instanceRef.current.props[key] = (props as any)[key]
      }
      const originalKeys = Object.keys(instanceRef.current.props)
      for (let i = 0; i < originalKeys.length; ++i) {
        const k = originalKeys[i]
        // eslint-disable-next-line @typescript-eslint/prefer-includes
        if (keys.indexOf(k) === -1) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete instanceRef.current.props[k]
        }
      }
    }
  }, [props])

  if (!instanceRef.current) {
    const updateCallback = (): void => {
      invokeLifecycle(instanceRef.current!, LifecycleHooks.BEFORE_UPDATE)
      forceUpdate(Object.create(null))
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      nextTick(() => {
        invokeLifecycle(instanceRef.current!, LifecycleHooks.UPDATED)
      })
    }

    const scope = effectScope()
    const parent = getCurrentInstance() as InternalInstance | null

    instanceRef.current = {
      scope: scope,
      setupState: null!,
      render: null,
      props: shallowReactive({ ...props }),
      parent: parent,
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
      ret = instanceRef.current.scope.run(() => setup(__TSGO_DEV__ ? shallowReadonly(instanceRef.current!.props) : instanceRef.current!.props))
    } catch (err) {
      instanceRef.current.scope.stop()
      instanceRef.current.scope = undefined!
      clearAllLifecycles(instanceRef.current)
      instanceRef.current = undefined
      resetParentInstance(parent)
      throw err
    }
    resetParentInstance(parent)

    const onTrack = (e: DebuggerEvent): void => {
      invokeLifecycle(instanceRef.current!, LifecycleHooks.RENDER_TRACKED, e)
    }
    const onTrigger = (e: DebuggerEvent): void => {
      invokeLifecycle(instanceRef.current!, LifecycleHooks.RENDER_TRIGGERED, e)
    }

    if (typeof ret === 'function') {
      let _args: any[] = []
      const runner = effect(() => ret(..._args), {
        lazy: true,
        scope: scope,
        scheduler: () => {
          if (!instanceRef.current || instanceRef.current.isMounted) {
            queuePreFlushCb(updateCallback)
          } else {
            updateCallback()
          }
        },
        onTrack,
        onTrigger
      })
      invokeLifecycle(instanceRef.current, LifecycleHooks.BEFORE_MOUNT)
      instanceRef.current.render = function (...args: any[]): any {
        _args = args
        const r = scope.run(() => runner())
        _args = []
        return r
      }
    } else {
      scope.run(() => {
        watch(() => ret, updateCallback, {
          deep: true,
          onTrack,
          onTrigger
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
      instanceRef.current!.scope.stop()
      invokeLifecycle(instanceRef.current!, LifecycleHooks.UNMOUNTED)
      clearAllLifecycles(instanceRef.current!)
      instanceRef.current!.scope = undefined!
      instanceRef.current!.isMounted = false
      instanceRef.current!.isUnmounted = true
      instanceRef.current = undefined
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

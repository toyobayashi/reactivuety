import { effect, stop, reactive, readonly, ReactiveEffect, ReactiveEffectOptions } from '@vue/reactivity'
import { PropsWithChildren, ReactElement, useCallback, useEffect, useRef } from 'react'
import { useForceUpdate } from './useForceUpdate'
import { setCurrentInstance, ComponentInternalInstance, LifecycleHooks, getCurrentInstance } from './core/component'
import { clearAllLifecycles, invokeLifecycle } from './core/apiLifecycle'
import { queueJob } from './core/scheduler'
import { traverse } from './core/apiWatch'

function clearInstanceBoundEffect (instance?: ComponentInternalInstance): void {
  if (instance) {
    for (let i = 0; i < instance.effects.length; i++) {
      stop(instance.effects[i])
    }
    instance.effects.length = 0
  }
}

/** @public */
export type SetupFunction<P = any, R = any> = (props: Readonly<PropsWithChildren<P>>) => R

/** @public */
export function useSetup<P> (setup: SetupFunction<P, () => ReactElement | null>, props: PropsWithChildren<P>): () => ReactElement | null

/** @public */
export function useSetup<P, R extends object> (setup: SetupFunction<P, R>, props: PropsWithChildren<P>): R

/** @public */
export function useSetup<P> (setup: (props: Readonly<PropsWithChildren<P>>) => any, props: PropsWithChildren<P>): any {
  if (typeof setup !== 'function') {
    throw new TypeError('setup is not a function')
  }
  const forceUpdate = useForceUpdate()

  const instanceRef = useRef<ComponentInternalInstance<P, any>>()

  const updateProps: { (): void; __called?: boolean } = useCallback(() => {
    if (instanceRef.current) {
      const keys = Object.keys(props)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        ;(instanceRef.current.props as any)[key] = (props as any)[key]
      }
    }
  }, [props])

  if (!updateProps.__called) {
    updateProps()
    updateProps.__called = true
  }

  const updateCallback = useCallback(() => {
    invokeLifecycle(instanceRef.current!, LifecycleHooks.BEFORE_UPDATE)
    forceUpdate()
    invokeLifecycle(instanceRef.current!, LifecycleHooks.UPDATED)
  }, [])

  if (!instanceRef.current) {
    const reactiveProps = reactive({ ...props })
    const readonlyProps = readonly(reactiveProps)
    instanceRef.current = {
      effects: [],
      setupResult: null!,
      render: null,
      props: reactiveProps,
      isMounted: false,
      isUnmounted: false,
      [LifecycleHooks.BEFORE_MOUNT]: null,
      [LifecycleHooks.MOUNTED]: null,
      [LifecycleHooks.BEFORE_UPDATE]: null,
      [LifecycleHooks.UPDATED]: null,
      [LifecycleHooks.BEFORE_UNMOUNT]: null,
      [LifecycleHooks.UNMOUNTED]: null,
      [LifecycleHooks.RENDER_TRACKED]: null,
      [LifecycleHooks.RENDER_TRIGGERED]: null
    }
    let runner: ReactiveEffect | null = null
    const reset = getCurrentInstance()
    setCurrentInstance(instanceRef.current)
    let ret: any
    try {
      ret = setup(readonlyProps as any)
    } catch (err) {
      clearInstanceBoundEffect(instanceRef.current)
      clearAllLifecycles(instanceRef.current)
      instanceRef.current = undefined
      setCurrentInstance(reset)
      throw err
    }
    setCurrentInstance(reset)
    const createEffectOptions = (): ReactiveEffectOptions => ({
      lazy: true,
      scheduler: (_job) => {
        queueJob(updateCallback)
      },
      onTrack (e) {
        invokeLifecycle(instanceRef.current!, LifecycleHooks.RENDER_TRACKED, e)
      },
      onTrigger (e) {
        invokeLifecycle(instanceRef.current!, LifecycleHooks.RENDER_TRIGGERED, e)
      }
    })
    if (ret == null) {
      invokeLifecycle(instanceRef.current, LifecycleHooks.BEFORE_MOUNT)
    } else if (typeof ret === 'function') {
      runner = effect(() => ret(), createEffectOptions())
      invokeLifecycle(instanceRef.current, LifecycleHooks.BEFORE_MOUNT)
      instanceRef.current.render = runner
    } else {
      runner = effect(() => {
        traverse(ret, new Set())
      }, createEffectOptions())
      runner()
      invokeLifecycle(instanceRef.current, LifecycleHooks.BEFORE_MOUNT)
    }

    instanceRef.current.setupResult = ret
    if (runner) {
      instanceRef.current.effects.push(runner)
    }
  }

  useEffect(() => {
    instanceRef.current!.isMounted = true
    instanceRef.current!.isUnmounted = false
    invokeLifecycle(instanceRef.current!, LifecycleHooks.MOUNTED)
    return () => {
      invokeLifecycle(instanceRef.current!, LifecycleHooks.BEFORE_UNMOUNT)
      clearInstanceBoundEffect(instanceRef.current)
      invokeLifecycle(instanceRef.current!, LifecycleHooks.UNMOUNTED)
      clearAllLifecycles(instanceRef.current!)
      instanceRef.current!.isMounted = false
      instanceRef.current!.isUnmounted = true
    }
  }, [])

  return instanceRef.current.render ?? instanceRef.current.setupResult
}

/** @public */
export function createSetupHook<P> (setup: SetupFunction<P, () => ReactElement | null>): (props: PropsWithChildren<P>) => () => ReactElement | null

/** @public */
export function createSetupHook<P, R extends object> (setup: SetupFunction<P, R>): (props: PropsWithChildren<P>) => R

export function createSetupHook<P> (setup: SetupFunction<P, any>): (props: PropsWithChildren<P>) => any {
  if (typeof setup !== 'function') {
    throw new TypeError('setup is not a function')
  }
  return function (props) {
    return useSetup(setup, props)
  }
}

import { effect, stop, reactive, readonly } from '@vue/reactivity'
import { PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { useForceUpdate } from './useForceUpdate'
import { setCurrentInstance, ComponentInternalInstance, LifecycleHooks } from './core/component'
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
export function useSetup<P, T> (setup: (props: Readonly<PropsWithChildren<P>>) => T, props: PropsWithChildren<P>): T {
  const forceUpdate = useForceUpdate()

  const instanceRef = useRef<ComponentInternalInstance<P, T>>()

  const updateProps: { (): void; __called?: boolean } = useCallback(() => {
    if (instanceRef.current) {
      const keys = Object.keys(props)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        ;(instanceRef.current.props as any)[key] = (props as any)[key]
      }
      invokeLifecycle(instanceRef.current, LifecycleHooks.UPDATED)
    }
  }, [props])

  if (!updateProps.__called) {
    updateProps()
    updateProps.__called = true
  }

  const updateCallback = useCallback(() => {
    forceUpdate()
    invokeLifecycle(instanceRef.current!, LifecycleHooks.UPDATED)
  }, [forceUpdate])

  if (!instanceRef.current) {
    const reactiveProps = reactive({ ...props })
    const readonlyProps = readonly(reactiveProps)
    const runner = effect(() => {
      setCurrentInstance(instanceRef.current!)
      let ret: T
      try {
        ret = setup(readonlyProps as any)
      } catch (err) {
        clearInstanceBoundEffect(instanceRef.current)
        clearAllLifecycles(instanceRef.current!)
        instanceRef.current = undefined
        setCurrentInstance(null)
        throw err
      }
      setCurrentInstance(null)
      if (typeof ret === 'function') {
        try {
          ret()
        } catch (err) {
          clearInstanceBoundEffect(instanceRef.current)
          clearAllLifecycles(instanceRef.current!)
          instanceRef.current = undefined
          setCurrentInstance(null)
          throw err
        }
        invokeLifecycle(instanceRef.current!, LifecycleHooks.BEFORE_MOUNT)
        return ret
      }
      invokeLifecycle(instanceRef.current!, LifecycleHooks.BEFORE_MOUNT)
      return traverse(ret, new Set())
    }, {
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

    instanceRef.current = {
      effects: [runner],
      data: undefined as any,
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
    instanceRef.current.data = runner()
  } else {
    invokeLifecycle(instanceRef.current, LifecycleHooks.BEFORE_UPDATE)
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

  return instanceRef.current.data
}

import { effect, stop, isRef, reactive, readonly } from '@vue/reactivity'
import { PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { useForceUpdate } from './useForceUpdate'
import { setCurrentInstance, ComponentInternalInstance, LifecycleHooks } from './core/component'
import { clearAllLifecycles, invokeLifecycle } from './core/apiLifecycle'
import { queueJob } from './core/scheduler'
import { isMap, isObject, isSet } from '@vue/shared'

function traverse<T extends unknown> (value: T, seen: Set<unknown> = new Set()): T {
  if (!isObject(value) || seen.has(value)) {
    return value
  }
  seen.add(value)
  if (isRef(value)) {
    traverse(value.value, seen)
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: unknown) => {
      traverse(v, seen)
    })
  } else {
    for (const key in value) {
      traverse(value[key], seen)
    }
  }
  return value
}

/** @public */
export function useSetup<P, T> (setup: (props: Readonly<PropsWithChildren<P>>) => T, props: PropsWithChildren<P>): T {
  const forceUpdate = useForceUpdate()

  const instanceRef = useRef<ComponentInternalInstance<P, T>>()

  const updateCallback = useCallback(() => {
    invokeLifecycle(instanceRef.current!, LifecycleHooks.BEFORE_UPDATE)
    forceUpdate()
    invokeLifecycle(instanceRef.current!, LifecycleHooks.UPDATED)
  }, [forceUpdate])

  const updateOnlyCallback = useCallback(() => {
    invokeLifecycle(instanceRef.current!, LifecycleHooks.BEFORE_UPDATE)
    invokeLifecycle(instanceRef.current!, LifecycleHooks.UPDATED)
  }, [])

  if (!instanceRef.current) {
    const reactiveProps = reactive({ ...props })
    const propRunner = effect(() => {
      traverse(reactiveProps)
    }, {
      lazy: true,
      scheduler: (_job) => {
        queueJob(updateOnlyCallback)
      }
    })
    propRunner()
    const readonlyProps = readonly(reactiveProps)
    const runner = effect(() => {
      setCurrentInstance(instanceRef.current!)
      let ret: T
      try {
        ret = setup(readonlyProps as any)
      } catch (err) {
        for (let i = 0; i < instanceRef.current!.effects.length; i++) {
          stop(instanceRef.current!.effects[i])
        }
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
          for (let i = 0; i < instanceRef.current!.effects.length; i++) {
            stop(instanceRef.current!.effects[i])
          }
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
      effects: [runner, propRunner],
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
  }

  useEffect(() => {
    const keys = Object.keys(props)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      ;(instanceRef.current!.props as any)[key] = (props as any)[key]
    }
  }, [props])

  useEffect(() => {
    instanceRef.current!.isMounted = true
    instanceRef.current!.isUnmounted = false
    invokeLifecycle(instanceRef.current!, LifecycleHooks.MOUNTED)
    return () => {
      invokeLifecycle(instanceRef.current!, LifecycleHooks.BEFORE_UNMOUNT)
      for (let i = 0; i < instanceRef.current!.effects.length; i++) {
        stop(instanceRef.current!.effects[i])
      }
      clearAllLifecycles(instanceRef.current!)
      invokeLifecycle(instanceRef.current!, LifecycleHooks.UNMOUNTED)
      instanceRef.current!.isMounted = false
      instanceRef.current!.isUnmounted = true
    }
  }, [])

  return instanceRef.current.data
}

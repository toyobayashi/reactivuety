import { effect, stop, isRef, reactive, readonly } from '@vue/reactivity'
import { PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { useForceUpdate } from './use-force-update'
import { clearAllLifeCycles, invokeLifeCycle, setContext, SetupContext, Lifecycle } from './lifecycle'
import { queueJob } from './scheduler'
import { isMap, isObject, isSet } from './shared'

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

  const context = useRef<SetupContext<P, T>>()

  const updateCallback = useCallback(() => {
    invokeLifeCycle(context.current!, Lifecycle.BEFORE_UPDATE)
    forceUpdate()
    invokeLifeCycle(context.current!, Lifecycle.UPDATED)
  }, [forceUpdate])

  if (!context.current) {
    const reactiveProps = reactive({ ...props })
    const runner = effect(() => {
      setContext(context.current!)
      let ret: T
      try {
        ret = setup(readonly(reactiveProps) as any)
      } catch (err) {
        stop(runner)
        clearAllLifeCycles(context.current!)
        context.current = undefined
        setContext(null)
        throw err
      }
      setContext(null)
      if (typeof ret === 'function') {
        try {
          ret()
        } catch (err) {
          stop(runner)
          clearAllLifeCycles(context.current!)
          context.current = undefined
          setContext(null)
          throw err
        }
        invokeLifeCycle(context.current!, Lifecycle.BEFORE_MOUNT)
        return ret
      }
      invokeLifeCycle(context.current!, Lifecycle.BEFORE_MOUNT)
      return traverse(ret, new Set())
    }, {
      lazy: true,
      scheduler: (_job) => {
        queueJob(updateCallback)
      },
      onTrack (e) {
        invokeLifeCycle(context.current!, Lifecycle.RENDER_TRACKED, e)
      },
      onTrigger (e) {
        invokeLifeCycle(context.current!, Lifecycle.RENDER_TRIGGERED, e)
      }
    })

    context.current = {
      runner,
      data: undefined as any,
      props: reactiveProps,
      lifecycles: {
        beforeMount: [],
        mounted: [],
        beforeUpdate: [],
        updated: [],
        beforeUnmount: [],
        unmounted: [],
        renderTracked: [],
        renderTriggered: []
      }
    }
    context.current.data = runner()
  }

  useEffect(() => {
    const keys = Object.keys(props)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      ;(context.current!.props as any)[key] = (props as any)[key]
    }
  }, [props])

  useEffect(() => {
    invokeLifeCycle(context.current!, Lifecycle.MOUNTED)
    return () => {
      invokeLifeCycle(context.current!, Lifecycle.BEFORE_UNMOUNT)
      stop(context.current!.runner)
      clearAllLifeCycles(context.current!)
      invokeLifeCycle(context.current!, Lifecycle.UNMOUNTED)
    }
  }, [])

  return context.current.data
}

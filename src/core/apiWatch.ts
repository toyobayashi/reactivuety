import {
  effect,
  stop,
  isRef,
  Ref,
  ComputedRef,
  ReactiveEffectOptions,
  isReactive
} from '@vue/reactivity'
import { SchedulerJob, queuePreFlushCb, queuePostFlushCb } from './scheduler'
import {
  EMPTY_OBJ,
  isObject,
  isArray,
  isFunction,
  // isString,
  hasChanged,
  NOOP,
  remove,
  isMap,
  isSet
} from '@vue/shared'
import {
  currentInstance,
  // ComponentInternalInstance,
  recordInstanceBoundEffect
} from './component'
import {
  callWithErrorHandling,
  callWithAsyncErrorHandling
} from './errorHandling'

const queuePostRenderEffect = queuePostFlushCb

/** @public */
export type WatchEffect = (onInvalidate: InvalidateCbRegistrator) => void

/** @public */
export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T)

/** @public */
export type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV,
  onInvalidate: InvalidateCbRegistrator
) => any

/** @public */
export type MapSources<T, Immediate> = {
  [K in keyof T]: T[K] extends WatchSource<infer V>
    ? Immediate extends true ? (V | undefined) : V
    : T[K] extends object
      ? Immediate extends true ? (T[K] | undefined) : T[K]
      : never
}

/** @public */
export type InvalidateCbRegistrator = (cb: () => void) => void

/** @public */
export interface WatchOptionsBase {
  flush?: 'pre' | 'post' | 'sync'
  onTrack?: ReactiveEffectOptions['onTrack']
  onTrigger?: ReactiveEffectOptions['onTrigger']
}

/** @public */
export interface WatchOptions<Immediate = boolean> extends WatchOptionsBase {
  immediate?: Immediate
  deep?: boolean
}

/** @public */
export type WatchStopHandle = () => void

// Simple effect.
/** @public */
export function watchEffect (
  effect: WatchEffect,
  options?: WatchOptionsBase
): WatchStopHandle {
  return doWatch(effect, null, options)
}

// initial value for watchers to trigger on undefined initial values
const INITIAL_WATCHER_VALUE = {}

// overload #1: array of multiple sources + cb
// Readonly constraint helps the callback to correctly infer value types based
// on position in the source array. Otherwise the values will get a union type
// of all possible value types.
/** @public */
export function watch<
  T extends Readonly<Array<WatchSource<unknown> | object>>,
  Immediate extends Readonly<boolean> = false
> (
  sources: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// overload #2: single source + cb
/** @public */
export function watch<T, Immediate extends Readonly<boolean> = false> (
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? (T | undefined) : T>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// overload #3: watching reactive object w/ cb
/** @public */
export function watch<
  T extends object,
  Immediate extends Readonly<boolean> = false
> (
  source: T,
  cb: WatchCallback<T, Immediate extends true ? (T | undefined) : T>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// implementation
export function watch<T = any, Immediate extends Readonly<boolean> = false> (
  source: T | WatchSource<T>,
  cb: any,
  options?: WatchOptions<Immediate>
): WatchStopHandle {
  return doWatch(source as any, cb, options)
}

function doWatch (
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb: WatchCallback | null,
  { immediate, deep, flush, onTrack, onTrigger }: WatchOptions = EMPTY_OBJ,
  instance = currentInstance
): WatchStopHandle {
  let getter: () => any
  let forceTrigger = false
  if (isRef(source)) {
    getter = () => (source as Ref).value
    forceTrigger = !!(source as any)._shallow
  } else if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (isArray(source)) {
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) {
          return traverse(s)
        } else if (isFunction(s)) {
          return callWithErrorHandling(s)
        }
      })
  } else if (isFunction(source)) {
    if (cb) {
      // getter with cb
      getter = () =>
        callWithErrorHandling(source)
    } else {
      // no cb -> simple effect
      getter = () => {
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (instance && instance.isUnmounted) {
          return
        }
        if (cleanup) {
          cleanup()
        }
        return callWithErrorHandling(
          source,
          [onInvalidate]
        )
      }
    }
  } else {
    getter = NOOP
  }

  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  let cleanup: () => void
  const onInvalidate: InvalidateCbRegistrator = (fn: () => void) => {
    cleanup = runner.options.onStop = () => {
      callWithErrorHandling(fn)
    }
  }

  let oldValue = isArray(source) ? [] : INITIAL_WATCHER_VALUE
  const job: SchedulerJob = () => {
    if (!runner.active) {
      return
    }
    if (cb) {
      // watch(source, cb)
      const newValue = runner()
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      if (deep || forceTrigger || hasChanged(newValue, oldValue)) {
        // cleanup before running cb again
        if (cleanup) {
          cleanup()
        }
        callWithAsyncErrorHandling(cb, [
          newValue,
          // pass undefined as the old value when it's changed for the first time
          oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
          onInvalidate
        ])
        oldValue = newValue
      }
    } else {
      // watchEffect
      runner()
    }
  }

  // important: mark the job as a watcher callback so that scheduler knows
  // it is allowed to self-trigger (#1727)
  job.allowRecurse = !!cb

  let scheduler: ReactiveEffectOptions['scheduler']
  if (flush === 'sync') {
    scheduler = job
  } else if (flush === 'post') {
    scheduler = () => queuePostRenderEffect(job/* , instance && instance.suspense */)
  } else {
    // default: 'pre'
    scheduler = () => {
      if (!instance || instance.isMounted) {
        queuePreFlushCb(job)
      } else {
        // with 'pre' option, the first call must happen before
        // the component is mounted so it is called synchronously.
        job()
      }
    }
  }

  const runner = effect(getter, {
    lazy: true,
    onTrack,
    onTrigger,
    scheduler
  })

  recordInstanceBoundEffect(runner, instance)

  // initial run
  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = runner()
    }
  } else if (flush === 'post') {
    queuePostRenderEffect(runner/* , instance && instance.suspense */)
  } else {
    runner()
  }

  return () => {
    stop(runner)
    if (instance) {
      remove(instance.effects, runner)
    }
  }
}

// this.$watch
// export function instanceWatch (
//   this: ComponentInternalInstance,
//   source: string | Function,
//   cb: WatchCallback,
//   options?: WatchOptions
// ): WatchStopHandle {
//   const publicThis = this.proxy as any
//   const getter = isString(source)
//     ? () => publicThis[source]
//     : source.bind(publicThis)
//   return doWatch(getter, cb.bind(publicThis), options, this)
// }

function traverse<T extends unknown> (value: T, seen: Set<unknown> = new Set()): T {
  if (!isObject(value) || seen.has(value)) {
    return value
  }
  seen.add(value)
  if (isRef(value)) {
    traverse(value.value, seen)
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => {
      traverse(v, seen)
    })
  } else {
    for (const key in value) {
      traverse(value[key], seen)
    }
  }
  return value
}

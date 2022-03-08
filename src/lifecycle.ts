import type {
  DebuggerEvent,
  EffectScope,
  UnwrapNestedRefs,
  ErrorCodes
} from '@vue/runtime-core'
// import {
//   // @ts-expect-error
//   createHook
// } from '@vue/runtime-core'
import { invokeArrayFns } from '@vue/shared'
import type { PropsWithChildren, ReactElement } from 'react'

export const enum LifecycleHooks {
  // BEFORE_CREATE = 'bc',
  // CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
  // DEACTIVATED = 'da',
  // ACTIVATED = 'a',
  RENDER_TRIGGERED = 'rtg',
  RENDER_TRACKED = 'rtc',
  ERROR_CAPTURED = 'ec'
}

export interface InternalInstance<P = any, S = any> {
  scope: EffectScope
  setupState: S
  render: ((context?: any) => ReactElement | null) | null
  props: UnwrapNestedRefs<PropsWithChildren<P>>

  parent: InternalInstance | null
  provides: Record<string | symbol, any> | null

  isMounted: boolean
  isUnmounted: boolean

  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook<() => void>
  [LifecycleHooks.MOUNTED]: LifecycleHook<() => void>
  [LifecycleHooks.BEFORE_UPDATE]: LifecycleHook<() => void>
  [LifecycleHooks.UPDATED]: LifecycleHook<() => void>
  [LifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook<() => void>
  [LifecycleHooks.UNMOUNTED]: LifecycleHook<() => void>
  [LifecycleHooks.RENDER_TRACKED]: LifecycleHook<(e: DebuggerEvent) => void>
  [LifecycleHooks.RENDER_TRIGGERED]: LifecycleHook<(e: DebuggerEvent) => void>
  [LifecycleHooks.ERROR_CAPTURED]: LifecycleHook<(err: unknown, type: ErrorTypes) => boolean | undefined>
}

export type LifecycleHook<T extends (...args: any[]) => any> = T[] | null

export type ErrorTypes = LifecycleHooks | ErrorCodes

export function invokeLifecycle (target: InternalInstance, type: LifecycleHooks, arg?: any): void {
  const methods = target[type]
  if (!methods || methods.length === 0) return
  invokeArrayFns(methods, arg)
}

export function clearAllLifecycles (target: InternalInstance): void {
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

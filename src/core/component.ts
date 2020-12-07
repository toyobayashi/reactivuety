import { DebuggerEvent, ReactiveEffect, Ref, UnwrapRef } from '@vue/reactivity'
import { PropsWithChildren } from 'react'

type UnwrapNestedRefs<T> = T extends Ref ? T : UnwrapRef<T>

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
  // ERROR_CAPTURED = 'ec'
}

type LifecycleHook<T extends (...args: any[]) => any> = T[] | null

export interface ComponentInternalInstance<P = any, T = any> {
  effects: ReactiveEffect[]
  data: T
  props: UnwrapNestedRefs<PropsWithChildren<P>>

  isMounted: boolean
  isUnmounted: boolean

  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook<() => void>
  /**
   * @internal
   */
  [LifecycleHooks.MOUNTED]: LifecycleHook<() => void>
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_UPDATE]: LifecycleHook<() => void>
  /**
   * @internal
   */
  [LifecycleHooks.UPDATED]: LifecycleHook<() => void>
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook<() => void>
  /**
   * @internal
   */
  [LifecycleHooks.UNMOUNTED]: LifecycleHook<() => void>
  /**
   * @internal
   */
  [LifecycleHooks.RENDER_TRACKED]: LifecycleHook<(e: DebuggerEvent) => void>
  /**
   * @internal
   */
  [LifecycleHooks.RENDER_TRIGGERED]: LifecycleHook<(e: DebuggerEvent) => void>
}

export let currentInstance: ComponentInternalInstance | null = null

export const getCurrentInstance: () => ComponentInternalInstance | null = () => currentInstance

export const setCurrentInstance = (instance: ComponentInternalInstance | null): void => {
  currentInstance = instance
}

export function recordInstanceBoundEffect (
  effect: ReactiveEffect,
  instance = currentInstance
): void {
  if (instance) {
    (instance.effects ?? (instance.effects = [])).push(effect)
  }
}

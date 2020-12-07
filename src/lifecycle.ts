import { ReactiveEffect, DebuggerEvent, UnwrapRef, Ref } from '@vue/reactivity'
import { PropsWithChildren } from 'react'

type UnwrapNestedRefs<T> = T extends Ref ? T : UnwrapRef<T>

export interface SetupContext<P = any, T = any> {
  runner: ReactiveEffect
  data: T
  props: UnwrapNestedRefs<PropsWithChildren<P>>
  lifecycles: {
    beforeMount: Array<() => void>
    mounted: Array<() => void>
    beforeUpdate: Array<() => void>
    updated: Array<() => void>
    beforeUnmount: Array<() => void>
    unmounted: Array<() => void>
    renderTracked: Array<(e: DebuggerEvent) => void>
    renderTriggered: Array<(e: DebuggerEvent) => void>
  }
}

let currentSetupContext: SetupContext | null = null

/** @public */
export function onBeforeMount (fn: () => void): void {
  if (currentSetupContext) currentSetupContext.lifecycles.beforeMount.push(fn)
}

/** @public */
export function onMounted (fn: () => void): void {
  if (currentSetupContext) currentSetupContext.lifecycles.mounted.push(fn)
}

/** @public */
export function onBeforeUpdate (fn: () => void): void {
  if (currentSetupContext) currentSetupContext.lifecycles.beforeUpdate.push(fn)
}

/** @public */
export function onUpdated (fn: () => void): void {
  if (currentSetupContext) currentSetupContext.lifecycles.updated.push(fn)
}

/** @public */
export function onBeforeUnmount (fn: () => void): void {
  if (currentSetupContext) currentSetupContext.lifecycles.beforeUnmount.push(fn)
}

/** @public */
export function onUnmounted (fn: () => void): void {
  if (currentSetupContext) currentSetupContext.lifecycles.unmounted.push(fn)
}

/** @public */
export function onRenderTracked (fn: (e: DebuggerEvent) => void): void {
  if (currentSetupContext) currentSetupContext.lifecycles.renderTracked.push(fn)
}

/** @public */
export function onRenderTriggered (fn: (e: DebuggerEvent) => void): void {
  if (currentSetupContext) currentSetupContext.lifecycles.renderTriggered.push(fn)
}

export function setContext (ctx: SetupContext | null): void {
  currentSetupContext = ctx
}

export enum Lifecycle {
  BEFORE_MOUNT = 'beforeMount',
  MOUNTED = 'mounted',
  BEFORE_UPDATE = 'beforeUpdate',
  UPDATED = 'updated',
  BEFORE_UNMOUNT = 'beforeUnmount',
  UNMOUNTED = 'unmounted',
  RENDER_TRACKED = 'renderTracked',
  RENDER_TRIGGERED = 'renderTriggered'
}

export function invokeLifeCycle<P, T> (ctx: SetupContext<P, T>, name: Lifecycle, ...args: any[]): void {
  const methods = (ctx.lifecycles as any)[name]
  if (methods.length === 0) return
  const arr = methods.slice()
  for (let i = 0; i < arr.length; i++) {
    const f = arr[i]
    try {
      f(...args)
    } catch (err) {
      console.error(err)
    }
  }
}

export function clearAllLifeCycles<P, T> (ctx: SetupContext<P, T>): void {
  const lifecycles = Object.keys(ctx.lifecycles)
  for (let i = 0; i < lifecycles.length; i++) {
    (ctx.lifecycles as any)[lifecycles[i]].length = 0
  }
}

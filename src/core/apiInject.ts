import { isFunction } from '@vue/shared'
import { ComponentInternalInstance, getCurrentInstance } from './component'

export const globalProvides: Record<string | symbol, any> = Object.create(null)

export let currentRenderingInstance: ComponentInternalInstance | null = null

export function getCurrentRenderingInstance (): ComponentInternalInstance | null {
  return currentRenderingInstance
}

export function setCurrentRenderingInstance (instance: ComponentInternalInstance | null): void {
  currentRenderingInstance = instance
}

/** @public */
export interface InjectionKey extends Symbol {}

/** @public */
export function provide<T> (key: InjectionKey | string | number, value: T): void {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    let provides = currentInstance.provides
    // by default an instance inherits its parent's provides object
    // but when it needs to provide values of its own, it creates its
    // own provides object using parent provides object as prototype.
    // this way in `inject` we can simply look up injections from direct
    // parent and let the prototype chain do the work.
    const parentProvides = currentInstance.parent ? currentInstance.parent.provides : null
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    // TS doesn't allow symbol as index type
    provides![key as string] = value
  } else {
    globalProvides[key as string] = value
  }
}

/** @public */
export function inject<T> (key: InjectionKey | string): T | undefined

/** @public */
export function inject<T> (
  key: InjectionKey | string,
  defaultValue: T,
  treatDefaultAsFactory?: false
): T

/** @public */
export function inject<T> (
  key: InjectionKey | string,
  defaultValue: T | (() => T),
  treatDefaultAsFactory: true
): T

export function inject (
  key: InjectionKey | string,
  defaultValue?: unknown,
  treatDefaultAsFactory = false
): void {
  const currentInstance = getCurrentInstance()

  const instance = currentInstance /* ?? currentRenderingInstance */
  if (instance) {
    // #2400
    // to support `app.use` plugins,
    // fallback to appContext's `provides` if the intance is at root
    const provides =
      instance.parent == null
        ? globalProvides
        : instance.parent.provides

    if (provides && (key as string | symbol) in provides) {
      // TS doesn't allow symbol as index type
      return provides[key as string]
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction(defaultValue)
        ? defaultValue()
        : defaultValue
    }
  }
}

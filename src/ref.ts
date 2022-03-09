import type { MutableRefObject } from 'react'
import { ref as _ref, shallowRef as _shallowRef, Ref, UnwrapRef } from '@vue/runtime-core'

function addCurrentProperty<R extends Ref<any>> (r: R): R {
  Object.defineProperty(r, 'current', {
    configurable: true,
    enumerable: true,
    get () {
      return r.value
    },
    set (newVal) {
      r.value = newVal
    }
  })
  return r
}

/** @public */
export function ref<T extends object> (value: T): MutableRefObject<T> & (T extends Ref ? T : Ref<UnwrapRef<T>>)
/** @public */
export function ref<T> (value: T): MutableRefObject<T> & Ref<UnwrapRef<T>>
/** @public */
export function ref<T = any> (): MutableRefObject<T> & Ref<T | undefined>

export function ref (value?: any): any {
  return addCurrentProperty(_ref(value))
}

/** @public */
export function shallowRef<T extends object> (value: T): MutableRefObject<T> & (T extends Ref ? T : Ref<T>)
/** @public */
export function shallowRef<T> (value: T): MutableRefObject<T> & Ref<T>
/** @public */
export function shallowRef<T = any> (): MutableRefObject<T> & Ref<T | undefined>

export function shallowRef (value?: any): any {
  return addCurrentProperty(_shallowRef(value))
}

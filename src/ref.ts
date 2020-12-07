import { MutableRefObject } from 'react'
import { ref as _ref, shallowRef as _shallowRef, Ref, UnwrapRef, toRaw, reactive } from '@vue/reactivity'
import { isObject } from './shared'

// eslint-disable-next-line no-self-compare
const hasChanged = (value: unknown, oldValue: unknown): boolean => value !== oldValue && (value === value || oldValue === oldValue)
const convert = <T>(val: T): T extends object ? (T extends Ref ? T : UnwrapRef<T>) : T => isObject(val) ? reactive(val) : val as any

function addCurrentProperty (r: any): void {
  Object.defineProperty(r, 'current', {
    configurable: true,
    enumerable: true,
    get () {
      return r._value
    },
    set (newVal) {
      if (hasChanged(toRaw(newVal), r._rawValue)) {
        r._rawValue = newVal
        r._value = r._shallow ? newVal : convert(newVal)
      }
    }
  })
}

/** @public */
export function ref<T extends object> (value: T): MutableRefObject<T> & (T extends Ref ? T : Ref<UnwrapRef<T>>)
/** @public */
export function ref<T> (value: T): MutableRefObject<T> & Ref<UnwrapRef<T>>
/** @public */
export function ref<T = any> (): MutableRefObject<T> & Ref<T | undefined>

export function ref (value?: any): any {
  const r = _ref(value)
  addCurrentProperty(r)
  return r
}

/** @public */
export function shallowRef<T extends object> (value: T): MutableRefObject<T> & (T extends Ref ? T : Ref<T>)
/** @public */
export function shallowRef<T> (value: T): MutableRefObject<T> & Ref<T>
/** @public */
export function shallowRef<T = any> (): MutableRefObject<T> & Ref<T | undefined>

export function shallowRef (value?: any): any {
  const r = _shallowRef(value)
  addCurrentProperty(r)
  return r
}

import {
  computed as _computed,
  ComputedRef,
  WritableComputedOptions,
  WritableComputedRef,
  ComputedGetter
} from '@vue/reactivity'
import { recordInstanceBoundEffect } from './component'

/** @public */
export function computed<T> (getter: ComputedGetter<T>): ComputedRef<T>

/** @public */
export function computed<T> (
  options: WritableComputedOptions<T>
): WritableComputedRef<T>

export function computed<T> (
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
): any {
  const c = _computed(getterOrOptions as any)
  recordInstanceBoundEffect(c.effect)
  return c
}

import { inject, InjectionKey } from '../core/apiInject'
import { Store } from './store'

export const storeKey = 'store'

export function useStore<S = any> (key?: InjectionKey | string): Store<S> | undefined {
  return inject(key != null ? key : storeKey)
}

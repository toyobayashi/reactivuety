import type { ShallowUnwrapRef } from '@vue/runtime-core'
import { ReactElement, PropsWithChildren, forwardRef, ForwardRefExoticComponent, PropsWithoutRef, RefAttributes, ForwardedRef } from 'react'
import { RenderFunction, SetupFunction, useSetup } from '../useSetup'

/* export type SetupReturnType<Setup> = Setup extends (...args: any[]) => infer R
  ? R extends (...args: any[]) => ReactElement | null
    ? R
    : R extends object
      ? ShallowUnwrapRef<R>
      : R
  : never */

/** @public */
export interface DefineComponentOptions<P, R extends RenderFunction<P, ForwardedRef<any>> | object> {
  setup: SetupFunction<P, R>
  name?: string
  render?: (state: ShallowUnwrapRef<R>, props: P, ref?: React.ForwardedRef<any>) => ReactElement | null
}

/** @public */
export function defineComponent<P, R extends RenderFunction<P, ForwardedRef<any>> | object = object> (
  options: DefineComponentOptions<P, R> | SetupFunction<P, R>
): ForwardRefExoticComponent<PropsWithChildren<PropsWithoutRef<P> & RefAttributes<any>>> {
  if (typeof options === 'function') {
    return defineComponent({
      name: options.name,
      setup: options
    })
  }

  if (typeof options === 'object' && options !== null) {
    const setup = options.setup
    const renderFunctionProvided = typeof options.render === 'function'
    const SetupComponent = forwardRef<any, P>(function (props, ref) {
      const stateOrRenderFunction = useSetup(setup, props)
      if (typeof stateOrRenderFunction === 'function') {
        return stateOrRenderFunction(props, ref)
      }
      if (renderFunctionProvided) {
        const state = stateOrRenderFunction as ShallowUnwrapRef<R>
        return options.render!(state, props, ref)
      }

      throw new TypeError('render function is not provided')
    })

    if (typeof options.name === 'string') {
      SetupComponent.displayName = options.name
    }

    return SetupComponent
  }

  throw new TypeError('Invalid component option')
}

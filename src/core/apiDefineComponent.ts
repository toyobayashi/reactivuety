import { ReactElement, PropsWithChildren, forwardRef, ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from 'react'
import { SetupFunction, useSetup } from '../useSetup'

/** @public */
export function defineComponent<P> (setup: SetupFunction<P, (context?: any) => ReactElement | null>, name?: string): ForwardRefExoticComponent<PropsWithChildren<PropsWithoutRef<P> & RefAttributes<any>>>

/** @public */
export function defineComponent<P, R extends object> (setup: SetupFunction<P, R>, render: (state: R, props: PropsWithChildren<P>, context?: any) => ReactElement | null, name?: string): ForwardRefExoticComponent<PropsWithChildren<PropsWithoutRef<P> & RefAttributes<any>>>

export function defineComponent<P> (setup: SetupFunction<P, any>, render?: any, name?: string): ForwardRefExoticComponent<PropsWithChildren<PropsWithoutRef<P> & RefAttributes<any>>> {
  if (typeof setup !== 'function') {
    throw new TypeError('setup is not a function')
  }

  if (typeof render === 'string') {
    name = render
    render = null
  }

  const renderFunctionProvided = typeof render === 'function'

  const SetupComponent = forwardRef<any, P>(function (props, ref) {
    const r = useSetup(setup, props)
    if (typeof r === 'function') {
      return r(ref)
    }
    if (renderFunctionProvided) {
      return render(r, props, ref)
    }

    throw new TypeError('render function is not provided')
  })

  if (typeof name === 'string') {
    SetupComponent.displayName = name
  }

  return SetupComponent
}

import { FunctionComponent, ReactElement, PropsWithChildren } from 'react'
import { SetupFunction, useSetup } from '../useSetup'

/** @public */
export function defineComponent<P> (setup: SetupFunction<P, (context?: any) => ReactElement | null>): FunctionComponent<P>

/** @public */
export function defineComponent<P, R extends object> (setup: SetupFunction<P, R>, render: (state: R, props: PropsWithChildren<P>, context?: any) => ReactElement | null): FunctionComponent<P>

export function defineComponent<P> (setup: SetupFunction<P, any>, render?: (state: any, props: PropsWithChildren<P>, context?: any) => ReactElement | null): FunctionComponent<P> {
  if (typeof setup !== 'function') {
    throw new TypeError('setup is not a function')
  }

  const renderFunctionProvided = typeof render === 'function'

  return function (props, context) {
    const r = useSetup(setup, props)
    if (typeof r === 'function') {
      return r(context)
    }
    if (renderFunctionProvided) {
      return render!(r, props, context)
    }

    throw new TypeError('render function is not provided')
  }
}

import { isFunction, isObject } from '@vue/shared'
import { defineComponent } from './apiDefineComponent'
import { ref } from '../ref'
import { handleError } from './errorHandling'
import * as React from 'react'

/** @public */
export type AsyncComponentResolveResult<P = any> = React.ComponentType<P> | { default: React.ComponentType<P> } // es modules

/** @public */
export type AsyncComponentLoader<P = any> = () => Promise<AsyncComponentResolveResult<P>>

/** @public */
export interface AsyncComponentOptions<P = any> {
  loader: AsyncComponentLoader<P>
  loadingComponent?: React.ComponentType<{}>
  errorComponent?: React.ComponentType<{ error: any }>
  delay?: number
  timeout?: number
  onError?: (
    error: Error,
    retry: () => void,
    fail: () => void,
    attempts: number
  ) => any
}

/** @public */
export function defineAsyncComponent<P = any> (source: AsyncComponentLoader<P> | AsyncComponentOptions<P>): React.ForwardRefExoticComponent<React.PropsWithChildren<React.PropsWithoutRef<P> & React.RefAttributes<any>>> {
  if (isFunction(source)) {
    source = { loader: source }
  }

  const {
    loader,
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    delay = 200,
    timeout, // undefined = never times out
    onError: userOnError
  } = source

  let pendingRequest: Promise<React.ComponentType<P>> | null = null
  let ResolvedComp: React.ComponentType<P>

  let retries = 0
  const retry = (): Promise<React.ComponentType<P>> => {
    retries++
    pendingRequest = null
    return load()
  }

  const load = (): Promise<React.ComponentType<P>> => {
    let thisRequest: Promise<React.ComponentType<P>>
    if (pendingRequest) {
      return pendingRequest
    }
    // eslint-disable-next-line prefer-const
    thisRequest = pendingRequest = loader()
      .catch(err => {
        err = err instanceof Error ? err : new Error(String(err))
        if (userOnError) {
          return new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            const userRetry = () => resolve(retry()); const userFail = () => reject(err)
            userOnError(err, userRetry, userFail, retries + 1)
          })
        } else {
          throw err
        }
      })
      .then((comp: any) => {
        if (thisRequest !== pendingRequest && pendingRequest) {
          return pendingRequest
        }
        if (!comp || (!isObject(comp) && !isFunction(comp))) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          throw new Error(`Invalid async component load result: ${comp}`)
        }
        // interop module default
        if (
          comp &&
          (comp.__esModule || comp[Symbol.toStringTag] === 'Module')
        ) {
          comp = comp.default
        }
        ResolvedComp = comp
        return comp
      })
    return thisRequest
  }

  const AsyncComponentWrapper = defineComponent<P>((props) => {
    if (ResolvedComp) {
      return (ref) => (
        ref !== undefined ? <ResolvedComp {...props} ref={ref} /> : <ResolvedComp {...props} />
      )
    }

    const onError = (err: Error): void => {
      pendingRequest = null
      handleError(
        err
      )
    }

    const loaded = ref(false)
    const error = ref()
    const delayed = ref(!!delay)

    if (delay) {
      setTimeout(() => {
        delayed.value = false
      }, delay)
    }

    if (timeout != null) {
      setTimeout(() => {
        if (!loaded.value && !error.value) {
          const err = new Error(
            `Async component timed out after ${timeout}ms.`
          )
          onError(err)
          error.value = err
        }
      }, timeout)
    }

    load()
      .then(() => {
        loaded.value = true
      })
      .catch(err => {
        onError(err)
        error.value = err
      })

    return (ref) => {
      if (loaded.value && ResolvedComp) {
        return ref !== undefined ? (<ResolvedComp {...props} ref={ref} />) : (<ResolvedComp {...props} />)
      } else if (error.value && ErrorComponent) {
        return (<ErrorComponent error={error.value} />)
      } else if (LoadingComponent && !delayed.value) {
        return (<LoadingComponent />)
      }
      return null
    }
  }, 'AsyncComponentWrapper')

  return AsyncComponentWrapper
}

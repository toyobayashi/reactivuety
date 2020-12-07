import * as React from 'react'

export type AsyncComponentProp<T> = T extends Promise<{ default: React.ComponentType<infer P> }> ? P : unknown

export function createAsyncComponent<
  T extends Promise<{ default: React.ComponentType<any> }>
> (asyncModulePromise: T): React.ComponentType<AsyncComponentProp<T>> {
  const LazyComponent = React.lazy(() => asyncModulePromise)
  return (props) => (
    <React.Suspense fallback={null}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

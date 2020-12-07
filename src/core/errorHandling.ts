import { isPromise, isFunction } from '@vue/shared'

export function callWithErrorHandling<T extends (...args: any[]) => any> (
  fn: T,
  args?: unknown[]
): ReturnType<T> {
  let res
  try {
    res = args ? fn(...args) : fn()
  } catch (err) {
    handleError(err)
  }
  return res
}

export function callWithAsyncErrorHandling<T extends (...args: any[]) => any> (
  fn: T | T[],
  args?: unknown[]
): any[] {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, args)
    if (res && isPromise(res)) {
      res.catch((err: any) => {
        handleError(err)
      })
    }
    return res
  }

  const values = []
  for (let i = 0; i < fn.length; i++) {
    values.push(callWithAsyncErrorHandling(fn[i], args))
  }
  return values
}

export function handleError (
  err: unknown
): void {
  logError(err)
}

function logError (
  err: unknown
): void {
  console.error(err)
}

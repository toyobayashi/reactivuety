import { isPromise, isFunction } from '@vue/shared'
import { ComponentInternalInstance, LifecycleHooks } from './component'

/** @public */
export const enum ErrorCodes {
  SETUP_FUNCTION,
  RENDER_FUNCTION,
  WATCH_GETTER,
  WATCH_CALLBACK,
  WATCH_CLEANUP,
  NATIVE_EVENT_HANDLER,
  COMPONENT_EVENT_HANDLER,
  VNODE_HOOK,
  DIRECTIVE_HOOK,
  TRANSITION_HOOK,
  APP_ERROR_HANDLER,
  APP_WARN_HANDLER,
  FUNCTION_REF,
  ASYNC_COMPONENT_LOADER,
  SCHEDULER
}

/** @public */
export type ErrorTypes = LifecycleHooks | ErrorCodes

let globalErrorHandler: null | ((err: unknown, type: ErrorTypes) => boolean | undefined) = null

/** @public */
export function setGlobalErrorHandler (handler: null | ((err: unknown, type: ErrorTypes) => boolean | undefined)): void {
  globalErrorHandler = handler
}

export function callWithErrorHandling<T extends (...args: any[]) => any> (
  fn: T,
  instance: ComponentInternalInstance | null,
  type: ErrorTypes,
  args?: unknown[]
): ReturnType<T> {
  let res
  try {
    res = args ? fn(...args) : fn()
  } catch (err) {
    handleError(err, instance, type)
  }
  return res
}

export function callWithAsyncErrorHandling<T extends (...args: any[]) => any> (
  fn: T | T[],
  instance: ComponentInternalInstance | null,
  type: ErrorTypes,
  args?: unknown[]
): any[] {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, instance, type, args)
    if (res && isPromise(res)) {
      res.catch((err: any) => {
        handleError(err, instance, type)
      })
    }
    return res
  }

  const values = []
  for (let i = 0; i < fn.length; i++) {
    values.push(callWithAsyncErrorHandling(fn[i], instance, type, args))
  }
  return values
}

export function handleError (
  err: unknown,
  instance: ComponentInternalInstance | null,
  type: ErrorTypes
): void {
  if (instance) {
    let cur = instance.parent

    const errorInfo = type
    while (cur) {
      const errorCapturedHooks = cur.ec
      if (errorCapturedHooks) {
        for (let i = 0; i < errorCapturedHooks.length; i++) {
          if (
            errorCapturedHooks[i](err, errorInfo) === false
          ) {
            return
          }
        }
      }
      cur = cur.parent
    }

    const appErrorHandler = globalErrorHandler
    if (isFunction(appErrorHandler)) {
      callWithErrorHandling(
        appErrorHandler,
        null,
        ErrorCodes.APP_ERROR_HANDLER,
        [err, errorInfo]
      )
      return
    }
  }
  logError(err)
}

function logError (
  err: unknown
): void {
  console.error(err)
}

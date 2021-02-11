import { inject } from '../index'
import { routerKey, routeLocationKey } from './injectionSymbols'
import { Router } from './router'
import { RouteLocationNormalizedLoaded } from './types'

/**
 * Returns the router instance. Equivalent to using `$router` inside
 * templates.
 */
export function useRouter(): Router {
  return inject<Router>(routerKey)!
}

/**
 * Returns the current route location. Equivalent to using `$route` inside
 * templates.
 */
export function useRoute(): RouteLocationNormalizedLoaded {
  return inject<RouteLocationNormalizedLoaded>(routeLocationKey)!
}

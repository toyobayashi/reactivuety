import {
  computed,
  ref
} from '@vue/reactivity'
import * as React from 'react'
import { inject, provide } from '../core/apiInject'
import { watch } from '../core/apiWatch'

import {
  RouteLocationNormalized,
  RouteLocationMatched,
} from './types/index'
import {
  matchedRouteKey,
  viewDepthKey,
  routerViewLocationKey,
} from './injectionSymbols'
import { assign } from './utils/index'
import { isSameRouteRecord } from './location'
import { useSetup } from '../useSetup'

export interface RouterViewProps {
  name?: string
  // allow looser type for user facing api
  route?: RouteLocationNormalized
}

export const RouterView: React.FunctionComponent<RouterViewProps> = (props) => {
  const { routeToDisplay, matchedRouteRef/* , viewRef */ } = useSetup((props) => {
    const injectedRoute = inject<any>(routerViewLocationKey)!
    const routeToDisplay = computed(() => props.route || injectedRoute.value)
    const depth = inject(viewDepthKey, 0)
    const matchedRouteRef = computed<RouteLocationMatched | undefined>(
      () => routeToDisplay.value.matched[depth]
    )

    provide(viewDepthKey, depth + 1)
    provide(matchedRouteKey, matchedRouteRef)
    provide(routerViewLocationKey, routeToDisplay)

    const viewRef = ref<any>()

    // watch at the same time the component instance, the route record we are
    // rendering, and the name
    watch(
      () => [viewRef.value, matchedRouteRef.value, props.name] as const,
      ([instance, to, name], [oldInstance, from, _oldName]) => {
        // copy reused instances
        if (to) {
          // this will update the instance for new instances as well as reused
          // instances when navigating to a new route
          to.instances[name!] = instance
          // the component instance is reused for a different route or name so
          // we copy any saved update or leave guards
          if (from && from !== to && instance && instance === oldInstance) {
            to.leaveGuards = from.leaveGuards
            to.updateGuards = from.updateGuards
          }
        }

        // trigger beforeRouteEnter next callbacks
        if (
          instance &&
          to &&
          // if there is no instance but to and from are the same this might be
          // the first visit
          (!from || !isSameRouteRecord(to, from) || !oldInstance)
        ) {
          ;(to.enterCallbacks[name!] || []).forEach(callback =>
            callback(instance)
          )
        }
      },
      { flush: 'post' }
    )

    return { routeToDisplay, matchedRouteRef, viewRef }
  }, props)

  const route = routeToDisplay.value
  const matchedRoute = matchedRouteRef.value
  const ViewComponent = matchedRoute && matchedRoute.components[props.name!]

  // we need the value at the time we render because when we unmount, we
  // navigated to a different location so the value is different
  // const currentName = props.name

  if (!ViewComponent) {
    return React.createElement(React.Fragment, null, props.children)
  }

  // props from route configuration
  const routePropsOption = matchedRoute!.props[props.name!]
  const routeProps = routePropsOption
    ? routePropsOption === true
      ? route.params
      : typeof routePropsOption === 'function'
      ? routePropsOption(route)
      : routePropsOption
    : null

  // const onVnodeUnmounted: VNodeProps['onVnodeUnmounted'] = vnode => {
  //   // remove the instance reference to prevent leak
  //   if (vnode.component!.isUnmounted) {
  //     matchedRoute!.instances[currentName] = null
  //   }
  // }

  return React.createElement(
    ViewComponent,
    assign({}, routeProps, props, {
      // onVnodeUnmounted,
      // ref: viewRef,
    })
  )
}

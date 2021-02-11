import {
  App,
  CustomInspectorNode,
  InspectorNodeTag,
  CustomInspectorState,
  HookPayloads,
  setupDevtoolsPlugin,
  TimelineEvent,
} from '@vue/devtools-api'
import { watch } from 'vue'
import { decode } from './encoding'
import { isSameRouteRecord } from './location'
import { RouterMatcher } from './matcher'
import { RouteRecordMatcher } from './matcher/pathMatcher'
import { PathParser } from './matcher/pathParserRanker'
import { Router } from './router'
import { RouteLocationNormalized } from './types'
import { assign } from './utils'

function formatRouteLocation(
  routeLocation: RouteLocationNormalized,
  tooltip?: string
) {
  const copy = assign({}, routeLocation, {
    // remove variables that can contain vue instances
    matched: routeLocation.matched.map(matched =>
      omit(matched, ['instances', 'children', 'aliasOf'])
    ),
  })

  return {
    _custom: {
      type: null,
      readOnly: true,
      display: routeLocation.fullPath,
      tooltip,
      value: copy,
    },
  }
}

function formatDisplay(display: string) {
  return {
    _custom: {
      display,
    },
  }
}

// to support multiple router instances
let routerId = 0

export function addDevtools(app: App, router: Router, matcher: RouterMatcher) {
  // Take over router.beforeEach and afterEach

  // increment to support multiple router instances
  const id = routerId++
  setupDevtoolsPlugin(
    {
      id: 'Router' + id ? ' ' + id : '',
      label: 'Router devtools',
      app,
    },
    api => {
      api.on.inspectComponent((payload, ctx) => {
        if (payload.instanceData) {
          payload.instanceData.state.push({
            type: 'Routing',
            key: '$route',
            editable: false,
            value: formatRouteLocation(
              router.currentRoute.value,
              'Current Route'
            ),
          })
        }
      })

      watch(router.currentRoute, () => {
        // refresh active state
        refreshRoutesView()
        // @ts-ignore
        api.notifyComponentUpdate()
        api.sendInspectorTree(routerInspectorId)
      })

      const navigationsLayerId = 'router:navigations:' + id

      api.addTimelineLayer({
        id: navigationsLayerId,
        label: `Router${id ? ' ' + id : ''} Navigations`,
        color: 0x40a8c4,
      })

      // const errorsLayerId = 'router:errors'
      // api.addTimelineLayer({
      //   id: errorsLayerId,
      //   label: 'Router Errors',
      //   color: 0xea5455,
      // })

      router.onError(error => {
        api.addTimelineEvent({
          layerId: navigationsLayerId,
          event: {
            // @ts-ignore
            logType: 'error',
            time: Date.now(),
            data: { error },
          },
        })
      })

      router.beforeEach((to, from) => {
        const data: TimelineEvent<any, any>['data'] = {
          guard: formatDisplay('beforeEach'),
          from: formatRouteLocation(
            from,
            'Current Location during this navigation'
          ),
          to: formatRouteLocation(to, 'Target location'),
        }

        api.addTimelineEvent({
          layerId: navigationsLayerId,
          event: {
            time: Date.now(),
            meta: {},
            data,
          },
        })
      })

      router.afterEach((to, from, failure) => {
        const data: TimelineEvent<any, any>['data'] = {
          guard: formatDisplay('afterEach'),
        }

        if (failure) {
          data.failure = {
            _custom: {
              type: Error,
              readOnly: true,
              display: failure ? failure.message : '',
              tooltip: 'Navigation Failure',
              value: failure,
            },
          }
          data.status = formatDisplay('❌')
        } else {
          data.status = formatDisplay('✅')
        }

        // we set here to have the right order
        data.from = formatRouteLocation(
          from,
          'Current Location during this navigation'
        )
        data.to = formatRouteLocation(to, 'Target location')

        api.addTimelineEvent({
          layerId: navigationsLayerId,
          event: {
            time: Date.now(),
            data,
            // @ts-ignore
            logType: failure ? 'warning' : 'default',
            meta: {},
          },
        })
      })

      /**
       * Inspector of Existing routes
       */

      const routerInspectorId = 'router-inspector:' + id

      api.addInspector({
        id: routerInspectorId,
        label: 'Routes' + (id ? ' ' + id : ''),
        icon: 'book',
        treeFilterPlaceholder: 'Search routes',
      })

      function refreshRoutesView() {
        // the routes view isn't active
        if (!activeRoutesPayload) return
        const payload = activeRoutesPayload

        // children routes will appear as nested
        let routes = matcher.getRoutes().filter(route => !route.parent)

        // reset match state to false
        routes.forEach(resetMatchStateOnRouteRecord)

        // apply a match state if there is a payload
        if (payload.filter) {
          routes = routes.filter(route =>
            // save matches state based on the payload
            isRouteMatching(route, payload.filter.toLowerCase())
          )
        }

        // mark active routes
        routes.forEach(route =>
          markRouteRecordActive(route, router.currentRoute.value)
        )
        payload.rootNodes = routes.map(formatRouteRecordForInspector)
      }

      let activeRoutesPayload: HookPayloads['getInspectorTree'] | undefined
      api.on.getInspectorTree(payload => {
        activeRoutesPayload = payload
        if (payload.app === app && payload.inspectorId === routerInspectorId) {
          refreshRoutesView()
        }
      })

      /**
       * Display information about the currently selected route record
       */
      api.on.getInspectorState(payload => {
        if (payload.app === app && payload.inspectorId === routerInspectorId) {
          const routes = matcher.getRoutes()
          const route = routes.find(
            route => (route.record as any).__vd_id === payload.nodeId
          )

          if (route) {
            payload.state = {
              options: formatRouteRecordMatcherForStateInspector(route),
            }
          }
        }
      })

      api.sendInspectorTree(routerInspectorId)
      api.sendInspectorState(routerInspectorId)
    }
  )
}

function modifierForKey(key: PathParser['keys'][number]) {
  if (key.optional) {
    return key.repeatable ? '*' : '?'
  } else {
    return key.repeatable ? '+' : ''
  }
}

function formatRouteRecordMatcherForStateInspector(
  route: RouteRecordMatcher
): CustomInspectorState[string] {
  const { record } = route
  const fields: CustomInspectorState[string] = [
    { editable: false, key: 'path', value: record.path },
  ]

  if (record.name != null) {
    fields.push({
      editable: false,
      key: 'name',
      value: record.name,
    })
  }

  fields.push({ editable: false, key: 'regexp', value: route.re })

  if (route.keys.length) {
    fields.push({
      editable: false,
      key: 'keys',
      value: {
        _custom: {
          type: null,
          readOnly: true,
          display: route.keys
            .map(key => `${key.name}${modifierForKey(key)}`)
            .join(' '),
          tooltip: 'Param keys',
          value: route.keys,
        },
      },
    })
  }

  if (record.redirect != null) {
    fields.push({
      editable: false,
      key: 'redirect',
      value: record.redirect,
    })
  }

  if (route.alias.length) {
    fields.push({
      editable: false,
      key: 'aliases',
      value: route.alias.map(alias => alias.record.path),
    })
  }

  fields.push({
    key: 'score',
    editable: false,
    value: {
      _custom: {
        type: null,
        readOnly: true,
        display: route.score.map(score => score.join(', ')).join(' | '),
        tooltip: 'Score used to sort routes',
        value: route.score,
      },
    },
  })

  return fields
}

/**
 * Extracted from tailwind palette
 */
const PINK_500 = 0xec4899
const BLUE_600 = 0x2563eb
const LIME_500 = 0x84cc16
const CYAN_400 = 0x22d3ee
const ORANGE_400 = 0xfb923c
// const GRAY_100 = 0xf4f4f5
const DARK = 0x666666

function formatRouteRecordForInspector(
  route: RouteRecordMatcher
): CustomInspectorNode {
  const tags: InspectorNodeTag[] = []

  const { record } = route

  if (record.name != null) {
    tags.push({
      label: String(record.name),
      textColor: 0,
      backgroundColor: CYAN_400,
    })
  }

  if (record.aliasOf) {
    tags.push({
      label: 'alias',
      textColor: 0,
      backgroundColor: ORANGE_400,
    })
  }

  if ((route as any).__vd_match) {
    tags.push({
      label: 'matches',
      textColor: 0,
      backgroundColor: PINK_500,
    })
  }

  if ((route as any).__vd_exactActive) {
    tags.push({
      label: 'exact',
      textColor: 0,
      backgroundColor: LIME_500,
    })
  }

  if ((route as any).__vd_active) {
    tags.push({
      label: 'active',
      textColor: 0,
      backgroundColor: BLUE_600,
    })
  }

  if (record.redirect) {
    tags.push({
      label:
        'redirect: ' +
        (typeof record.redirect === 'string' ? record.redirect : 'Object'),
      textColor: 0xffffff,
      backgroundColor: DARK,
    })
  }

  // add an id to be able to select it. Using the `path` is not possible because
  // empty path children would collide with their parents
  let id = String(routeRecordId++)
  ;(record as any).__vd_id = id

  return {
    id,
    label: record.path,
    tags,
    // @ts-ignore
    children: route.children.map(formatRouteRecordForInspector),
  }
}

//  incremental id for route records and inspector state
let routeRecordId = 0

const EXTRACT_REGEXP_RE = /^\/(.*)\/([a-z]*)$/

function markRouteRecordActive(
  route: RouteRecordMatcher,
  currentRoute: RouteLocationNormalized
) {
  // no route will be active if matched is empty
  // reset the matching state
  const isExactActive =
    currentRoute.matched.length &&
    isSameRouteRecord(
      currentRoute.matched[currentRoute.matched.length - 1],
      route.record
    )
  ;(route as any).__vd_exactActive = (route as any).__vd_active = isExactActive

  if (!isExactActive) {
    ;(route as any).__vd_active = currentRoute.matched.some(match =>
      isSameRouteRecord(match, route.record)
    )
  }

  route.children.forEach(childRoute =>
    markRouteRecordActive(childRoute, currentRoute)
  )
}

function resetMatchStateOnRouteRecord(route: RouteRecordMatcher) {
  ;(route as any).__vd_match = false
  route.children.forEach(resetMatchStateOnRouteRecord)
}

function isRouteMatching(route: RouteRecordMatcher, filter: string): boolean {
  const found = String(route.re).match(EXTRACT_REGEXP_RE)
  // reset the matching state
  ;(route as any).__vd_match = false
  if (!found || found.length < 3) {
    return false
  }

  // use a regexp without $ at the end to match nested routes better
  const nonEndingRE = new RegExp(found[1].replace(/\$$/, ''), found[2])
  if (nonEndingRE.test(filter)) {
    // mark children as matches
    route.children.forEach(child => isRouteMatching(child, filter))
    // exception case: `/`
    if (route.record.path !== '/' || filter === '/') {
      ;(route as any).__vd_match = route.re.test(filter)
      return true
    }
    // hide the / route
    return false
  }

  const path = route.record.path.toLowerCase()
  const decodedPath = decode(path)

  // also allow partial matching on the path
  if (
    !filter.startsWith('/') &&
    (decodedPath.includes(filter) || path.includes(filter))
  )
    return true
  if (decodedPath.startsWith(filter) || path.startsWith(filter)) return true
  if (route.record.name && String(route.record.name).includes(filter))
    return true

  return route.children.some(child => isRouteMatching(child, filter))
}

function omit<T extends object, K extends [...(keyof T)[]]>(obj: T, keys: K) {
  const ret = {} as {
    [K2 in Exclude<keyof T, K[number]>]: T[K2]
  }

  for (let key in obj) {
    if (!keys.includes(key as any)) {
      // @ts-ignore
      ret[key] = obj[key]
    }
  }
  return ret
}

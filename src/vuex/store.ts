import { reactive } from '@vue/reactivity'
import { watch, WatchOptions } from '../core/apiWatch'
import { InjectionKey, provide } from '../core/apiInject'
import { storeKey } from './injectKey'
import ModuleCollection from './module/module-collection'
import { forEachValue, isObject, isPromise, assert, partial } from './util'

export interface DispatchOptions {
  root?: boolean;
}

export interface CommitOptions {
  silent?: boolean;
  root?: boolean;
}

export interface Payload {
  type: string;
}

export interface Dispatch {
  (type: string, payload?: any, options?: DispatchOptions): Promise<any>;
  <P extends Payload>(payloadWithType: P, options?: DispatchOptions): Promise<any>;
}

export interface Commit {
  (type: string, payload?: any, options?: CommitOptions): void;
  <P extends Payload>(payloadWithType: P, options?: CommitOptions): void;
}

export interface ActionContext<S, R> {
  dispatch: Dispatch;
  commit: Commit;
  state: S;
  getters: any;
  rootState: R;
  rootGetters: any;
}

export type ActionHandler<S, R> = (this: Store<R>, injectee: ActionContext<S, R>, payload?: any) => any;
export interface ActionObject<S, R> {
  root?: boolean;
  handler: ActionHandler<S, R>;
}

export type Getter<S, R> = (state: S, getters: any, rootState: R, rootGetters: any) => any;
export type Action<S, R> = ActionHandler<S, R> | ActionObject<S, R>;
export type Mutation<S> = (state: S, payload?: any) => any;
export type Plugin<S> = (store: Store<S>) => any;

export interface GetterTree<S, R> {
  [key: string]: Getter<S, R>;
}

export interface ActionTree<S, R> {
  [key: string]: Action<S, R>;
}

export interface MutationTree<S> {
  [key: string]: Mutation<S>;
}

export interface Module<S, R> {
  namespaced?: boolean;
  state?: S | (() => S);
  getters?: GetterTree<S, R>;
  actions?: ActionTree<S, R>;
  mutations?: MutationTree<S>;
  modules?: ModuleTree<R>;
}

export interface ModuleTree<R> {
  [key: string]: Module<any, R>;
}

export interface StoreOptions<S> {
  state?: S | (() => S);
  getters?: GetterTree<S, S>;
  actions?: ActionTree<S, S>;
  mutations?: MutationTree<S>;
  modules?: ModuleTree<S>;
  plugins?: Plugin<S>[];
  strict?: boolean;
  devtools?: boolean;
}

export interface MutationPayload extends Payload {
  payload: any;
}

export interface SubscribeOptions {
  prepend?: boolean
}

export interface ActionPayload extends Payload {
  payload: any;
}

export interface ActionSubscribersObject<P, S> {
  before?: ActionSubscriber<P, S>;
  after?: ActionSubscriber<P, S>;
  error?: ActionErrorSubscriber<P, S>;
}
export type ActionSubscriber<P, S> = (action: P, state: S) => any;
export type ActionErrorSubscriber<P, S> = (action: P, state: S, error: Error) => any;
export type SubscribeActionOptions<P, S> = ActionSubscriber<P, S> | ActionSubscribersObject<P, S>;

export interface ModuleOptions {
  preserveState?: boolean;
}

export function createStore<S> (options: StoreOptions<S>): Store<S> {
  return new Store(options)
}

export class Store<S> {
  private _committing: boolean
  private _actions: any
  private _actionSubscribers: any[]
  protected _wrappedGetters: any
  private _modules: ModuleCollection
  protected _modulesNamespaceMap: any
  private _subscribers: any[]
  protected _makeLocalGettersCache: any
  protected strict: boolean
  private _state!: { data: S }
  private _mutations: any
  public readonly getters: any

  public constructor (options: StoreOptions<S> = {}) {
    if (__TSGO_DEV__) {
      assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
      assert(this instanceof Store, `store must be called with the new operator.`)
    }

    const {
      plugins = [],
      strict = false
    } = options

    // store internal state
    this._committing = false
    this._actions = Object.create(null)
    this._actionSubscribers = []
    this._actions = Object.create(null)
    this._wrappedGetters = Object.create(null)
    this._modules = new ModuleCollection(options)
    this._modulesNamespaceMap = Object.create(null)
    this._subscribers = []
    this._makeLocalGettersCache = Object.create(null)

    // bind commit and dispatch to self
    const store = this
    const { dispatch, commit } = this
    this.dispatch = function boundDispatch (type: any, payload?: any) {
      return dispatch.call(store, type, payload)
    }
    this.commit = function boundCommit (type: any, payload?: any, options?: any) {
      return (commit as any).call(store, type, payload, options)
    }

    // strict mode
    this.strict = strict

    const state = this._modules.root!.state

    // init root module.
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    installModule(this, state, [], this._modules.root)

    // initialize the store state, which is responsible for the reactivity
    // (also registers _wrappedGetters as computed properties)
    resetStoreState(this, state)

    // apply plugins
    plugins.forEach(plugin => plugin(this))
  }

  public install (injectKey: InjectionKey) {
    provide(injectKey || storeKey, this)
  }

  public get state (): S {
    return this._state.data
  }

  public set state (_v: S) {
    if (__TSGO_DEV__) {
      assert(false, `use store.replaceState() to explicit replace store state.`)
    }
  }

  public commit (type: string, payload?: any, options?: CommitOptions): void
  public commit<P extends Payload> (payloadWithType: P, options?: CommitOptions): void

  public commit (_type: any, _payload?: any, _options?: any) {
    // check object-style commit
    const {
      type,
      payload,
      options
    } = unifyObjectStyle(_type, _payload, _options)

    const mutation = { type, payload }
    const entry = this._mutations[type]
    if (!entry) {
      if (__TSGO_DEV__) {
        console.error(`[vuex] unknown mutation type: ${type}`)
      }
      return
    }
    this._withCommit(() => {
      entry.forEach(function commitIterator (handler: any) {
        handler(payload)
      })
    })

    this._subscribers
      .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
      .forEach(sub => sub(mutation, this.state))

    if (
      __TSGO_DEV__ &&
      options && options.silent
    ) {
      console.warn(
        `[vuex] mutation type: ${type}. Silent option has been removed. ` +
        'Use the filter functionality in the vue-devtools'
      )
    }
  }

  public dispatch (type: string, payload?: any, options?: DispatchOptions): Promise<any>
  public dispatch<P extends Payload> (payloadWithType: P, options?: DispatchOptions): Promise<any>
  public dispatch (_type: any, _payload?: any) {
    // check object-style dispatch
    const {
      type,
      payload
    } = unifyObjectStyle(_type, _payload)

    const action = { type, payload }
    const entry: Function[] = this._actions[type]
    if (!entry) {
      if (__TSGO_DEV__) {
        console.error(`[vuex] unknown action type: ${type}`)
      }
      return
    }

    try {
      this._actionSubscribers
        .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
        .filter(sub => sub.before)
        .forEach(sub => sub.before(action, this.state))
    } catch (e) {
      if (__TSGO_DEV__) {
        console.warn(`[vuex] error in before action subscribers: `)
        console.error(e)
      }
    }

    const result: Promise<any> = entry.length > 1
      ? Promise.all(entry.map(handler => handler(payload)))
      : entry[0](payload)

    return new Promise((resolve, reject) => {
      result.then(res => {
        try {
          this._actionSubscribers
            .filter(sub => sub.after)
            .forEach(sub => sub.after(action, this.state))
        } catch (e) {
          if (__TSGO_DEV__) {
            console.warn(`[vuex] error in after action subscribers: `)
            console.error(e)
          }
        }
        resolve(res)
      }, error => {
        try {
          this._actionSubscribers
            .filter(sub => sub.error)
            .forEach(sub => sub.error(action, this.state, error))
        } catch (e) {
          if (__TSGO_DEV__) {
            console.warn(`[vuex] error in error action subscribers: `)
            console.error(e)
          }
        }
        reject(error)
      })
    })
  }

  public subscribe <P extends MutationPayload>(fn: (mutation: P, state: S) => any, options?: SubscribeOptions): () => void {
    return genericSubscribe(fn, this._subscribers, options)
  }

  public subscribeAction <P extends ActionPayload>(fn: SubscribeActionOptions<P, S>, options?: SubscribeOptions): () => void {
    const subs = typeof fn === 'function' ? { before: fn } : fn
    return genericSubscribe(subs, this._actionSubscribers, options)
  }

  /**
   * @param {Function} getter 
   * @param {Function} cb 
   * @param {any} options
   * @returns {() => void} 
   */
  public watch<T> (getter: (state: S, getters: any) => T, cb: (value: T, oldValue: T | undefined) => void, options?: WatchOptions): () => void {
    if (__TSGO_DEV__) {
      assert(typeof getter === 'function', `store.watch only accepts a function.`)
    }
    return watch<T, boolean>(() => getter(this.state, this.getters), cb, Object.assign({}, options))
  }

  public replaceState (state: S): void {
    this._withCommit(() => {
      this._state.data = state
    })
  }

  public registerModule<T> (path: string | string[], rawModule: Module<T, S>, options: ModuleOptions = {}) {
    if (typeof path === 'string') path = [path]

    if (__TSGO_DEV__) {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
      assert(path.length > 0, 'cannot register the root module by using registerModule.')
    }

    this._modules.register(path, rawModule)
    installModule(this, this.state, path, this._modules.get(path), options.preserveState)
    // reset store to update getters...
    resetStoreState(this, this.state)
  }

  public unregisterModule (path: string | string[]) {
    if (typeof path === 'string') path = [path]

    if (__TSGO_DEV__) {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
    }

    this._modules.unregister(path)
    this._withCommit(() => {
      const parentState = getNestedState(this.state, path.slice(0, -1))
      delete parentState[path[path.length - 1]]
    })
    resetStore(this)
  }

  public hasModule (path: string | string[]): boolean {
    if (typeof path === 'string') path = [path]

    if (__TSGO_DEV__) {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
    }

    return this._modules.isRegistered(path)
  }

  public hotUpdate (newOptions: {
    actions?: ActionTree<S, S>;
    mutations?: MutationTree<S>;
    getters?: GetterTree<S, S>;
    modules?: ModuleTree<S>;
  }): void {
    this._modules.update(newOptions)
    resetStore(this, true)
  }

  private _withCommit (fn: Function) {
    const committing = this._committing
    this._committing = true
    fn()
    this._committing = committing
  }
}

function genericSubscribe (fn: any, subs: any, options: any) {
  if (subs.indexOf(fn) < 0) {
    options && options.prepend
      ? subs.unshift(fn)
      : subs.push(fn)
  }
  return () => {
    const i = subs.indexOf(fn)
    if (i > -1) {
      subs.splice(i, 1)
    }
  }
}

function resetStore (store: any, hot?: any) {
  store._actions = Object.create(null)
  store._mutations = Object.create(null)
  store._wrappedGetters = Object.create(null)
  store._modulesNamespaceMap = Object.create(null)
  const state = store.state
  // init all modules
  installModule(store, state, [], store._modules.root, true)
  // reset state
  resetStoreState(store, state, hot)
}

function resetStoreState (store: any, state: any, hot?: any) {
  const oldState = store._state

  // bind store public getters
  store.getters = {}
  // reset local getters cache
  store._makeLocalGettersCache = Object.create(null)
  const wrappedGetters = store._wrappedGetters
  const computedObj: any = {}
  forEachValue(wrappedGetters, (fn: any, key: any) => {
    // use computed to leverage its lazy-caching mechanism
    // direct inline function use will lead to closure preserving oldState.
    // using partial to return function with only arguments preserved in closure environment.
    computedObj[key] = partial(fn, store)
    Object.defineProperty(store.getters, key, {
      // TODO: use `computed` when it's possible. at the moment we can't due to
      // https://github.com/vuejs/vuex/pull/1883
      get: () => computedObj[key](),
      enumerable: true // for local getters
    })
  })

  store._state = reactive({
    data: state
  })

  // enable strict mode for new state
  if (store.strict) {
    enableStrictMode(store)
  }

  if (oldState) {
    if (hot) {
      // dispatch changes in all subscribed watchers
      // to force getter re-evaluation for hot reloading.
      store._withCommit(() => {
        oldState.data = null
      })
    }
  }
}

function installModule (store: any, rootState: any, path: any, module: any, hot?: any) {
  const isRoot = !path.length
  const namespace = store._modules.getNamespace(path)

  // register in namespace map
  if (module.namespaced) {
    if (store._modulesNamespaceMap[namespace] && __TSGO_DEV__) {
      console.error(`[vuex] duplicate namespace ${namespace} for the namespaced module ${path.join('/')}`)
    }
    store._modulesNamespaceMap[namespace] = module
  }

  // set state
  if (!isRoot && !hot) {
    const parentState = getNestedState(rootState, path.slice(0, -1))
    const moduleName = path[path.length - 1]
    store._withCommit(() => {
      if (__TSGO_DEV__) {
        if (moduleName in parentState) {
          console.warn(
            `[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join('.')}"`
          )
        }
      }
      parentState[moduleName] = module.state
    })
  }

  const local = module.context = makeLocalContext(store, namespace, path)

  module.forEachMutation((mutation: any, key: any) => {
    const namespacedType = namespace + key
    registerMutation(store, namespacedType, mutation, local)
  })

  module.forEachAction((action: any, key: any) => {
    const type = action.root ? key : namespace + key
    const handler = action.handler || action
    registerAction(store, type, handler, local)
  })

  module.forEachGetter((getter: any, key: any) => {
    const namespacedType = namespace + key
    registerGetter(store, namespacedType, getter, local)
  })

  module.forEachChild((child: any, key: any) => {
    installModule(store, rootState, path.concat(key), child, hot)
  })
}

/**
 * make localized dispatch, commit, getters and state
 * if there is no namespace, just use root ones
 */
function makeLocalContext (store: any, namespace: any, path: any) {
  const noNamespace = namespace === ''

  const local = {
    dispatch: noNamespace ? store.dispatch : (_type: any, _payload: any, _options?: any) => {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || !options.root) {
        type = namespace + type
        if (__TSGO_DEV__ && !store._actions[type]) {
          console.error(`[vuex] unknown local action type: ${args.type}, global type: ${type}`)
          return
        }
      }

      return store.dispatch(type, payload)
    },

    commit: noNamespace ? store.commit : (_type: any, _payload: any, _options?: any) => {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || !options.root) {
        type = namespace + type
        if (__TSGO_DEV__ && !store._mutations[type]) {
          console.error(`[vuex] unknown local mutation type: ${args.type}, global type: ${type}`)
          return
        }
      }

      store.commit(type, payload, options)
    }
  }

  // getters and state object must be gotten lazily
  // because they will be changed by state update
  Object.defineProperties(local, {
    getters: {
      get: noNamespace
        ? () => store.getters
        : () => makeLocalGetters(store, namespace)
    },
    state: {
      get: () => getNestedState(store.state, path)
    }
  })

  return local
}

function makeLocalGetters (store: any, namespace: any) {
  if (!store._makeLocalGettersCache[namespace]) {
    const gettersProxy = {}
    const splitPos = namespace.length
    Object.keys(store.getters).forEach(type => {
      // skip if the target getter is not match this namespace
      if (type.slice(0, splitPos) !== namespace) return

      // extract local getter type
      const localType = type.slice(splitPos)

      // Add a port to the getters proxy.
      // Define as getter property because
      // we do not want to evaluate the getters in this time.
      Object.defineProperty(gettersProxy, localType, {
        get: () => store.getters[type],
        enumerable: true
      })
    })
    store._makeLocalGettersCache[namespace] = gettersProxy
  }

  return store._makeLocalGettersCache[namespace]
}

function registerMutation (store: any, type: any, handler: any, local: any) {
  const entry = store._mutations[type] || (store._mutations[type] = [])
  entry.push(function wrappedMutationHandler (payload: any) {
    handler.call(store, local.state, payload)
  })
}

function registerAction (store: any, type: any, handler: any, local: any) {
  const entry = store._actions[type] || (store._actions[type] = [])
  entry.push(function wrappedActionHandler (payload: any) {
    let res = handler.call(store, {
      dispatch: local.dispatch,
      commit: local.commit,
      getters: local.getters,
      state: local.state,
      rootGetters: store.getters,
      rootState: store.state
    }, payload)
    if (!isPromise(res)) {
      res = Promise.resolve(res)
    }
    if (store._devtoolHook) {
      return res.catch((err: Error) => {
        store._devtoolHook.emit('vuex:error', err)
        throw err
      })
    } else {
      return res
    }
  })
}

function registerGetter (store: any, type: any, rawGetter: any, local: any) {
  if (store._wrappedGetters[type]) {
    if (__TSGO_DEV__) {
      console.error(`[vuex] duplicate getter key: ${type}`)
    }
    return
  }
  store._wrappedGetters[type] = function wrappedGetter (store: any) {
    return rawGetter(
      local.state, // local state
      local.getters, // local getters
      store.state, // root state
      store.getters // root getters
    )
  }
}

function enableStrictMode (store: any) {
  watch(() => store._state.data, () => {
    if (__TSGO_DEV__) {
      assert(store._committing, `do not mutate vuex store state outside mutation handlers.`)
    }
  }, { deep: true, flush: 'sync' })
}

function getNestedState (state: any, path: any) {
  return path.reduce((state: any, key: any) => state[key], state)
}

function unifyObjectStyle (type: any, payload?: any, options?: any) {
  if (isObject(type) && type.type) {
    options = payload
    payload = type
    type = type.type
  }

  if (__TSGO_DEV__) {
    assert(typeof type === 'string', `expects string as the type, but found ${typeof type}.`)
  }

  return { type, payload, options }
}

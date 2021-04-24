/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute
} from '../util/index'

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

/**
 * 设置对象的属性代理，例如 proxy(vm, '_data', key) 的作用： vm[key] --> vm._data[key]
 * @param {Object} target
 * @param {string} sourceKey
 * @param {string} key
 */
export function proxy(target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter(val) {
    return this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

/**
 * 设置 Vue.prototype.$data
 * 设置 Vue.prototype.$props
 * 设置 Vue.prototype.$set
 * 设置 Vue.prototype.$delete
 * 设置 Vue.prototype.$watch
 * @param {Class<Component>} Vue
 */
export function stateMixin(Vue: Class<Component>) {
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  Vue.prototype.$set = set
  Vue.prototype.$delete = del

  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      try {
        cb.call(vm, watcher.value)
      } catch (error) {
        handleError(error, vm, `callback for immediate watcher "${watcher.expression}"`)
      }
    }
    return function unwatchFn() {
      watcher.teardown()
    }
  }
}

/**
 * 初始化 $options.props, $options.propData
 * 初始化 $options.methods
 * 初始化 $options.data
 * 初始化 $options.computed
 * 初始化 $options.watch
 * @param {Component} vm
 */
export function initState(vm: Component) {
  // 设置 vm_watchers
  vm._watchers = []
  const opts = vm.$options

  // 初始化 $options.props, $options.propData，设置为响应式
  if (opts.props) initProps(vm, opts.props)

  // 初始化 $options.methods
  if (opts.methods) initMethods(vm, opts.methods)

  // 初始化 $options.data，设置为响应式
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true)
  }

  // 初始化 $options.computed, 设置 [computed watcher]
  if (opts.computed) initComputed(vm, opts.computed)

  // 初始化 $options.watch, 设置 [user watcher]
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}

/**
 * 初始化 $options.props, $options.propData
 *  设置 vm._props
 *  设置 vm.$options._propKeys
 *  设置 vm[propsKey] ==> vm._props[propsKey]
 * @param {Component} vm
 * @param {Object} propsOptions
 */
function initProps(vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  if (!isRoot) {
    // 设置为当前执行不可观察不可设置为响应式
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
        config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }

    // 设置 vm[key] ==> vm._props[key]
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  // 设置为当前执行可观察并设置为响应式
  toggleObserving(true)
}

/**
 * 初始化 $options.methods
 *  设置 vm[key] --> bind(methods[key], vm)
 * @param {Component} vm
 * @param {Object} methods
 */
function initMethods(vm: Component, methods: Object) {
  const props = vm.$options.props
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      // methods[key] 为函数则警告
      if (typeof methods[key] !== 'function') {
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      // 此前仅仅初始化 props 因此对比 props 的 key 是否与 methods 重合
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      // methods 的 key 是否是 vm 保留关键字
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // 设置 vm[key] 为 bind(methods[key], vm)
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}

/**
 * 初始化 $options.data
 *  设置 vm._data 并具有响应式
 *  设置 vm[key] ==> vm._data[key]
 * @param {Component} vm
 */
function initData(vm: Component) {
  let data = vm.$options.data

  // 设置 vm_data 为 $options.data 的数据值
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }

  // 校验 $options.data 是否与 $options.props, $options.methods 的配置项属性重复或者是否是保留属性，并设置设置 vm[dataKey] ==> vm._data[dataKey]
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      // 判断 $options.methods 是否存在和 $options.data 重复的 key
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      // 判断 $options.props 是否存在和 $options.data 重复的 key
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      // 设置 vm[dataKey] ==> vm._data[dataKey]
      proxy(vm, `_data`, key)
    }
  }

  // 创建根数据的数据订阅者, 设置根数据为响应式
  observe(data, true)
}

/**
 * 纯粹获取 $options.data 的数据值而不执行响应式操作，由于设置了 pushTarget() 和 popTarget() 因此不会触发响应式影响到发布者的操作
 * @param {Function} data
 * @param {Component} vm
 */
export function getData(data: Function, vm: Component): any {
  pushTarget()
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}

/**
 * 初始化 $options.computed
 *    例如 vm.$options.message = 'Hello Vue', vm.$options.computed.newMessage = () => `New ${this.message}`
 *    初次加载时:
 *        vm.render --> 访问到 newMessage --> vm.computed.newMessage --> computedGetter
 *          --> [computed watcher].evaluate() --> [computed watcher].get() --> 设置 computed watcher 为 Dep.target, [computed watcher].getter() --> vm.$options.computed.newMessage() --> 获取 this.message --> reactive get() --> dep.depend() --> 依赖收集 [computed watcher] 订阅该响应式数据存储的 Dep --> 返回 vm.$options.computed.newMessage() 最新值
 *          --> watcher.depend() --> 依赖收集 [vm watcher] 订阅 [computed watcher] 订阅的所有数据发布者 Dep
 *          --> 返回 [computed watcher].value --> newMessage
 *    设置 this.message = 'Change Hello Vue':
 *        派发更新 reactive set() --> dep.notify()
 *            --> [computed watcher].update --> [computed watcher].dirty = true 设置该 computed 属性的属性值拥有最新的 value 仍未返回(仍未访问)
 *            --> [vm watcher].update --> queueWatcher --> 等收集完当前 vm 组件的所有 [vm watcher] 和 [user watcher] 再执行当前 Tick: flushSchedulerQueue --> watcher.run() --> [vm watcher].get() --> vm.render 重复 [初次加载时] 的步骤(完)
 */
const computedWatcherOptions = { lazy: true }
function initComputed(vm: Component, computed: Object) {
  // $flow-disable-line
  // 设置 vm._computedWatchers
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()

  for (const key in computed) {
    // 获取 computed watcher 的 getter
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    // vm._computedWatchers[key] --> watcher
    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      // 如果 vm 不存在 key 属性则定义 computed
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      // 如果 vm 不存在 key 属性则警告 data 或者 prop 是否已经定义了 key
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}

// 设置 vm.computed[key] 的 getter 和 setter
export function defineComputed(
  target: any,
  key: string,
  userDef: Object | Function
) {
  // 获取 vm key 的 getter 和 setter
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }

  // 如果 vm key 的 setter 不存在则设置访问 setter 时发出警告
  if (process.env.NODE_ENV !== 'production' &&
    sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }

  // 设置 vm key 的 getter 和 setter
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

// 获取 vm.computed[key] 的 getter
function createComputedGetter(key) {
  return function computedGetter() {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // watcher.value 获取 computed[key]() 执行的结果
      if (watcher.dirty) {
        watcher.evaluate()
      }
      // 让当前渲染 watcher (即当前正执行的 vm 组件渲染 watcher)订阅该 computed watcher 订阅过的所有发布者
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter() {
    return fn.call(this, this)
  }
}

/**
 * 初始化 $options.watch
 * @param {Component} vm
 * @param {Object} watch
 */
function initWatch(vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher(
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}

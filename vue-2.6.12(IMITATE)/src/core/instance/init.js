/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state.js'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/pref'
import { initLifecycle, callHook } from '../lifecycle'
import { initProvide, initInjections } from '../inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

/**
 * 设置 Vue.prototype._init
 * @param {Class<Component>} Vue
 */
export function initMinix(Vue: Class<Component>) {
  /**
   * @param {Object} options
   */
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // 设置 vm._uid
    vm._uid = uid++

    let startTag, endTag
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-pref-start:${vm._uid}`
      endTag = `vue-pref-end:${vm._uid}`
      mark(startTag)
    }

    // 设置 vm._isVue
    vm._isVue = true

    // 设置 vm.$options
    if (options && options._isComponent) {
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }

    //设置 vm._renderProxy
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }

    // 设置 vm._self
    vm._self = vm

    /**
     * 设置 vm.$parent
     * 设置 vm.$root
     * 设置 vm.$children
     * 设置 vm.$refs
     * 设置 vm._watcher
     * 设置 vm._inactive
     * 设置 vm._directInactive
     * 设置 vm._isMounted
     * 设置 vm._isDestoryed
     * 设置 vm._isBeingDestoryed
     */
    initLifecycle(vm)
    /**
     * 设置 vm._events
     * 设置 vm._hasHookEvent
     */
    initEvents(vm)
    /**
     * 设置 vm._vnode
     * 设置 vm._staticTrees
     * 设置 vm.$vnode
     * 设置 vm.$slot
     * 设置 vm.$scopedSlots
     * 设置 vm._c
     * 设置 vm.$createElement
     * 设置 vm.$attrs
     * 设置 vm.$listeners
     */
    initRender(vm)

    callHook(vm, 'beforeCreate')

    // 设置 vm 从 provide 能获取的 injection 属性
    initInjections(vm)
    /**
     * 初始化 vm.$options.props, $options.propData
     * 初始化 vm.$options.methods
     * 初始化 vm.$options.data
     * 初始化 vm.$options.computed
     * 初始化 vm.$options.watch
     */
    initState(vm)
    // 设置 vm._provided
    initProvide(vm)

    callHook(vm, 'created')

    // 计算 vm 实例初始化的性能(不包括挂载到 DOM 执行 VNode 的过程)
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      // 设置 vm._name
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    // vm.$options 存在 el 则挂载 vm 到真实 DOM
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

// 组件 vm 实例化初始化 options
export function initInternalComponent(vm: Component, options: internalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions(Ctor: Class<Component>) {
  let options = Ctor.options
  // 存在父构造函数
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // 设置 Ctor.superOptions
      // 设置 Ctor.extendOptions
      // 设置 Ctor.options
      Ctor.superOptions = superOptions
      const modifiedOptions = resolveModifiedOptions(Ctor)
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions(Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}

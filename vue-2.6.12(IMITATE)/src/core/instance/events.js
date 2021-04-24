/* @flow */

import {
  tip,
  toArray,
  hyphenate,
  formatComponentName,
  invokeWithErrorHandling
} from '../util/index'
import { updateListeners } from '../vdom/helpers/index'

/**
 * 设置 vm._events
 * 设置 vm._hasHookEvent
 * @param {Component} vm
 */
export function initEvents(vm: Component) {
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

/**
 * 设置 Vue.prototype.$on
 * 设置 Vue.prototype.$once
 * 设置 Vue.prototype.$off
 * 设置 Vue.prototype.$emit
 * @param {*} Vue
 */
export function eventsMixin(Vue: Class<Component>) {
  const hookRE = /^hook:/

  /**
   * 注册事件
   * @param {*} event
   * @param {*} fn
   */
  Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    const vm: Component = this
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn)
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }

  /**
   * 注册事件（单次执行）
   * @param {string} event
   * @param {Function} fn
   */
  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    function on() {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn
    vm.$on(event, on)
    return vm
  }

  /**
   * 移除事件
   * @param {string | Array<string>} event
   * @param {Function} fn
   */
  Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this

    // 如果没有提供参数，则移除所有的事件监听器
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }

    // 如果指定事件是一个数组则逐一递归执行移除操作
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }

    const cbs = vm._events[event]

    // 如果指定事件的监听器不存在则返回
    if (!cbs) {
      return vm
    }
    // 如果只提供了事件，则移除该事件所有的监听器
    if (!fn) {
      vm._events[event] = null
      return vm
    }

    // 如果同时提供了事件与回调，则只移除这个回调的监听器
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break;
      }
    }

    return vm
  }

  /**
   * 触发事件
   * @param {string} event
   */
  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    if (process.env.NODE_ENV !== 'production') {
      const lowerCaseEvent = event.toLowerCase()
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    let cbs = vm._event[event]
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      const args = toArray(arguments, 1)
      const info = `event handler for "${event}"`
      for (let i = 0, l = cbs.length; i < l; i++) {
        invokeWithErrorHandling(cbs[i], vm, args, vm, info)
      }
    }
    return vm
  }
}

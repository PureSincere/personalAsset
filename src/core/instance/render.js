/* @flow */

import {
  warn,
  nextTick,
  emptyObject,
  handleError,
  defineReactive
} from '../util/index'

import { createElement } from '../vdom/create-element'
import { installRenderHelpers } from './render-helpers/index'
import { resolveSlots } from '../render-helpers/resolve-slots'
import { nornalizeScopedSlots } from '../vdom/helpers/normalize-scoped-slots'
import VNode, { createEmptyVNode } from '../vdom/vnode'

import { isUpdatingChildComponent } from './lifecycle'

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
 * @param {Component} vm
 */
export function initRender(vm: Component) {
  vm._vnode = null
  vm._staticTrees = null
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode
  const renderContext = parentVnode && parentVnode.context
  vm.$slot = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)

  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

  // 设置 vm.$attrs
  // 设置 vm.$listeners
  const parentData = parentVnode && parentVnode.data
  if (process.enc.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
    }, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
}

// 当前正执行渲染，渲染为 vnode 的 vm 实例
export let currentRenderingInstance: Component | null = null
// for testing only
export function setCurrentRenderingInstance(vm: Component) {
  currentRenderingInstance = vm
}

/**
 * 设置 Vue.prototype.$nextTick
 * 设置 Vue.prototype._render
 * 设置 Vue.prototype._o
 * 设置 Vue.prototype._n
 * 设置 Vue.prototype._s
 * 设置 Vue.prototype._l
 * 设置 Vue.prototype._t
 * 设置 Vue.prototype._q
 * 设置 Vue.prototype._i
 * 设置 Vue.prototype._m
 * 设置 Vue.prototype._f
 * 设置 Vue.prototype._k
 * 设置 Vue.prototype._b
 * 设置 Vue.prototype._v
 * 设置 Vue.prototype._e
 * 设置 Vue.prototype._u
 * 设置 Vue.prototype._g
 * 设置 Vue.prototype._d
 * 设置 Vue.prototype._p
 * @param {Class<Component>} Vue
 */
export function renderMixin(Vue: Class<Component>) {
  // install runtime convenience helpers
  /**
   * 设置 Vue.prototype._o
   * 设置 Vue.prototype._n
   * 设置 Vue.prototype._s
   * 设置 Vue.prototype._l
   * 设置 Vue.prototype._t
   * 设置 Vue.prototype._q
   * 设置 Vue.prototype._i
   * 设置 Vue.prototype._m
   * 设置 Vue.prototype._f
   * 设置 Vue.prototype._k
   * 设置 Vue.prototype._b
   * 设置 Vue.prototype._v
   * 设置 Vue.prototype._e
   * 设置 Vue.prototype._u
   * 设置 Vue.prototype._g
   * 设置 Vue.prototype._d
   * 设置 Vue.prototype._p
   */
  installRenderHelpers(Vue.prototype)

  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick(fn, this)
  }

  /**
   * 设置 vm.$vnode
   * 设置 vm.$scopedSlots
   */
  Vue.prototype._render = function (): VNode {
    const vm: Component = this
    const { render, _parentVnode } = vm.$options

    if (_parentVnode) {
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots,
        vm.$scopedSlots
      )
    }

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
      // There's no need to maintain a stack because all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.

      // 获取当前 vm 实例 $options.render 函数生成的 vnode
      currentRenderingInstance = vm//当前 vm 实例
      vnode = render.call(vm._renderProxy, vm.$createElement) // render(vm.$createElement) this 为 vm._renderProxy

    } catch (e) {
      handleError(e, vm, `render`)
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
        } catch (e) {
          handleError(e, vm, `renderError`)
          vnode = vm._vnode
        }
      } else {
        vnode = vm._vnode
      }
    } finally {
      currentRenderingInstance = null
    }
    // if the returned array contains only a single node, allow it
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0]
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = createEmptyVNode()
    }
    // set parent
    vnode.parent = _parentVnode
    return vnode
  }
}

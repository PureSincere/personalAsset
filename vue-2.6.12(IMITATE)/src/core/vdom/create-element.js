/* @flow */

import config from '../config'
import VNode, { createEmptyVNode } from './vnode'
import { createComponent } from './create-component'
import { traverse } from '../observer/traverse'

import {
  warn,
  isDef,
  isUndef,
  isTrue,
  isObject,
  isPrimitive,
  resolveAsset
} from '../util/index'

import {
  normalizeChildren,
  simpleNormalizeChildren
} from './helpers/index'

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

/**
 * 创建 vnode
 * @param {Component} context
 * @param {any} tag
 * @param {any} data
 * @param {any} children
 * @param {any} normalizationType
 * @param {boolean} alwaysNormalize
 */
export function createElement(
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  // 如果 data 为原始数据不为对象则重载
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  // 是否深度扁平化 children vnode 数组
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  // 实际创建 vnode
  return _createElement(context, tag, data, children, normalizationType)
}

/**
 * 创建 vnode
 * @param {Component} context
 * @param {string | Class<Component> | Function | Object} tag
 * @param {VNodeData} data
 * @param {any} children
 * @param {number} normalizationType
 */
export function _createElement(
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {

  // data 为数据 observe 时发出警告,并返回空的注释 vnode
  if (isDef(data) && isDef((data: any).__ob__)) {
    process.env.NODE_ENV !==='production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    return createEmptyVNode()
  }

  // data.is 用于 :is 特殊 attribute，指示组件名
  if (isDef(data) && isDef(data.is)) {
    tag = data.is
  }

  // 如果 tag 不存在则返回空的注释 vnode
  if (!tag) {
    return createEmptyVNode()
  }

  // data.key 不为原始数据 string, number, boolean, symbol 时发出警告
  if (process.env.NODE_ENV !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    if (!__WEEX__ || !('@binding' in data.key)) {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      )
    }
  }

  if (Array.isArray(children) && typeof children[0] === 'function') {
    data = data || {}
    data.scopedSlots = { default: children[0] }
    children.length = 0
  }

  // 扁平化 children 数组
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }

  let vnode, ns
  // tag 为标签名，创建非组件 vnode 或者组件 vnode
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)// 获取标签命名空间
    // tag 是保留标签，创建非组件 vnode
    if (config.isReservedTag(tag)) {
      // v-on 绑定在保留标签发出警告
      if (process.env.NODE_ENV !== 'production' && isDef(data) && isDef(data.nativeOn)) {
        warn(
          `The .native modifier for v-on is only valid on components but it was used on <${tag}>.`,
          context
        )
      }

      // 创建 [Element vnode]
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    }
    // tag 不是保留标签，创建组件 vnode
    /**
     * 例如
     * let vm = new Vue({
     *    el: '#app',
     *    components: {
     *      App: {
     *        data() {
     *          return {
     *            message: 'Hello App Clild'
     *          }
     *        },
     *        render(h) {
     *          return h('div', {
     *            attrs: {
     *              id: "#app-child-1"
     *            },
     *          }, this.message)
     *        }
     *      }
     *    },
     *    render(h) {
     *      return h('App')
     *    }
     *  })
     */
    else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // 配置项存在子组件。data 或者 data.pre 不存在而且 context.$options.components.tag 存在则创建组件 vnode


      vnode = createComponent(Ctor, data, context, children, tag)
    }
    // tag 不是保留标签，创建非组件 vnode
    else {
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  }
  // tag 不为标签名，创建组件 vnode
  /**
   * 例如
   *  let vm = new Vue({
   *    el: '#app',
   *    render(h) {
   *      return h({
   *        data() {
   *          return {
   *            message: 'Hello App Clild'
   *          }
   *        },
   *        render(h) {
   *          return h('div', {
   *            attrs: {
   *              id: "#app-child-1"
   *            },
   *          }, this.message)
   *        }
   *      })
   *    }
   *  })
   */
  else {
    vnode = createComponent(tag, data, context, children)
  }

  // 已创建 Array<VNode>，则直接返回
  if (Array.isArray(vnode)) {
    return vnode
  }
  // 已创建 vnode，处理完 vnode 返回
  else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns) //给 svg 标签添加命名空间
    if (isDef(data)) registerDeepBindings(data) // 让当前正执行的 watcher 订阅 data.style 或者 data.class 保存的 Dep（Dep 收集依赖）
    return vnode
  }
  // 未创建 vnode，则创建一个空的注释 vnode
  else {
    return createEmptyVNode()
  }
}

/**
 * 给 svg 标签添加命名空间
 * @param {*} vnode
 * @param {*} ns
 * @param {*} force
 */
function applyNS(vnode, ns, force) {
  vnode.ns = ns
  if (vnode.tag === 'foreignObject') {
    ns = undefined
    force = true
  }
  if (isDef(vnode.children)) {
    for (let i = 0, l = vnode.length; i < l; i++) {
      const child = vnode.children[i]
      if (isDef(child.tag) && (isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force)
      }
    }
  }
}

// 让当前正执行的 watcher 订阅 data.style 或者 data.class 保存的 Dep（Dep 收集依赖）
function registerDeepBindings(data) {
  if (isObject(data.style)) {
    traverse(data.style)
  }
  if (isObject(data.class)) {
    traverse(data.class)
  }
}

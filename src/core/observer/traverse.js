/* @flow */

import { _Set as Set, isObject } from '../util/index'
import type { SimpleSet } from '../util/index'
import VNode from '../vdom/vnode'

const seenObjects = new Set()// 存储访问过的数据, 用于比对递归遍历过程中的数据是否被访问过

/**
 * 递归访问数据, 执行 reactive get 让当前执行 watcher 订阅 Dep (Dep 收集依赖)
 * @param {any} val
 */
export function traverse(val: any) {
  _traverse(val, seenObjects)
  seenObjects.clear()
}

function _traverse(val: any, seen: SimpleSet) {
  let i, keys
  const isA = Array.isArray(val)
  if ((!isA) && !isObject(val) || Object.isFrozen(val) || val instanceof VNode) {
    return
  }

  // 如果数据已经是响应式数据而且已经访问过则直接返回
  if (val.__ob__) {
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }

  // 递归访问数据, 执行 reactive get 让当前执行 watcher 订阅 Dep
  if (isA) {
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}

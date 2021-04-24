/* @flow */

import { isDef, isObject } from 'shared/util'

export function genClassForVnode(vnode: VNodeWithData): string {
  let data = vnode.data
  let parentNode = vnode
  let childNode = vnode
  while (isDef(childNode.componentInstance)) {
    childNode = childNode.componentInstance._vnode
    if (childNode && childNode.data) {
      data = mergeClassData(childNode.data, data)
    }
  }
  while (isDef(parentNode = parentNode.parent)) {
    if (parentNode && parentNode.data) {
      data = mergeClassData(data, parentNode.data)
    }
  }
  return renderClass(data.staticClass, data.class)
}

// 合并两个 vnode 的 vnode.data.class
function mergeClassData(child: VNodeData, parent: VNodeData): {
  staticClass: string,
  class: any
} {
  return {
    staticClass: concat(child.staticClass, parent.staticClass),
    class: isDef(child.class)
      ? [child.class, parent.class]
      : parent.class
  }
}

/**
 * 合并静态 class 和动态 class 为一个 class
 * 例如 renderClass('class-a', [{'class-b': true, 'class-c': true}, ['class-d', 'class-e'], 'class-f']) --> 'class-a class-b class-c class-d class-e class-f'
 * 静态 class 为字符串，动态 class 可以为 数组，对象和字符串
 * @param {?string} staticClass
 * @param {any} dynamicClass
 */
export function renderClass(
  staticClass: ?string,
  dynamicClass: any
): string {
  if (isDef(staticClass) || isDef(dynamicClass)) {
    return concat(staticClass, stringifyClass(dynamicClass))
  }
  /* istanbul ignore next */
  return ''
}
// 通过空格合并两个字符串，例如 concat('class-a', 'class-b') --> 'class-a class-b'
export function concat(a: ?string, b: ?string): string {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}
// 通过空格合并 value(数组，对象，字符串) 的字符串
// 例如 stringifyClass(['class-a', 'class-b'])-- > 'class-a class-b'，或者 stringifyClass({ 'class-a': true, 'class-b': true })-- > 'class-a class-b'
export function stringifyClass(value: any): string {
  if (Array.isArray(value)) {
    return stringifyArray(value)
  }
  if (isObject(value)) {
    return stringifyObject(value)
  }
  if (typeof value === 'string') {
    return value
  }
  /* istanbul ignore next */
  return ''
}
// 通过空格合并数组的所有数组元素的字符串，例如 stringifyArray(['class-a', 'class-b']) --> 'class-a class-b'
function stringifyArray(value: Array<any>): string {
  let res = ''
  let stringified
  for (let i = 0, l = value.length; i < l; i++) {
    if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
      if (res) res += ' '
      res += stringified
    }
  }
  return res
}
// 通过空格合并对象的所有属性值的字符串，例如 stringifyObject({'class-a': true, 'class-b': true}) --> 'class-a class-b'
function stringifyObject(value: Object): string {
  let res = ''
  for (const key in value) {
    if (value[key]) {
      if (res) res += ' '
      res += key
    }
  }
  return res
}

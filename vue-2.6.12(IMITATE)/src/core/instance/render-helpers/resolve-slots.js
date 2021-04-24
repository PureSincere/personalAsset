/* @flow */

import type VNode from 'core/vdom/vnode.js'

export function resolveSlots(
  children: ?Array<VNode>,
  context: ?Component
): { [key: string]: Array<VNode> } {
  if (!children || !children.length) {
    return {}
  }
  const slots = {}
  for (let i = 0, l = children.length; i < l; i++) {
    const child = children[i]
    const data = child.data
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot
    }
    if ((child.context === context || child.fnContext === context) && data && data.slot != null) {
      const name = data.slot
      const slot = (slots[name] || (slots[name] = []))
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || [])
      } else {
        slot.push(child)
      }
    } else {
      (slots.default || (slots.default = [])).push(child)
    }
  }
  for (const name in slots) {
    if (slots[name].every(isWhitespace)) {
      delete slots[name]
    }
  }
  return slots
}

/**
 * 判断 vnode 是否为注释节点或者空白字符节点
 * @param {VNode} node
 */
function isWhitespace(node: VNode): boolean {
  return (node.isComment && !node.asyncFactory) || node.text = ' '
}

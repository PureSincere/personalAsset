/* @flow */

export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<Vnode>;
  text: string | void;
  elm: Node | void;
  ns: string | void;
  context: Component | void;
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void;
  parent: VNode | void;

  raw: boolean;
  isStatic: boolean;
  isRootInsert: boolean;
  isComment: boolean;
  isCloned: boolean;
  isOnce: boolean;
  asyncFactory: Function | void;
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void;
  fnOptions: ?ComponentOptions;
  devtoolsMeta: ?Object;
  fnScopeId: ?string;

  /**
   * 构造函数，用于创建 vnode
   * @param {string} tag
   * @param {VNodeData} data
   * @param {?Array<VNode>} children
   * @param {string} text
   * @param {Node} elm
   * @param {Component} context
   * @param {VNodeComponentOptions} componentOptions
   * @param {Function} asyncFactory
   */
  constructor(
    tag?: string,//标签名
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,// vnode 元素指向的 Element 对象
    context?: Component,//Vue 组件
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.context = context
    this.componentOptions = componentOptions
    this.asyncFactory = asyncFactory
    this.key = data && data.key
    this.ns = undefined
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = false
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false

    // this.ssrContext
    // this.devtoolsMeta
  }

  get child(): Component | void {
    return this.componentInstance
  }
}

/**
 * 创建一个空的注释 vnode
 * @param {string} text
 */
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}

/**
 * 创建一个文本 vnode
 * @param {string | number} val
 */
export function createTextVNode(val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}

/**
 * 创建一个克隆的 vnode
 * @param {VNode} vnode
 */
export function cloneVNode(vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true

  // componentInstance
  // parent
  // raw
  // isRootInsert
  // isOnce
  // isAsyncPlaceholder
  // ssrContext
  // devtoolsMeta

  return cloned
}

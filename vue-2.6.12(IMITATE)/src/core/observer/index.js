/* @flow */

/**
 * 注意：
 *    new Observe 里的 new Dep 用于创建对象数据保留的发布者
 *        new Observe 里的 new Dep 用于创建对象数据保留的发布者主要用于 Vue.set 函数触发 ob.dep.notify() 放入到 watcher update 执行队列和当前执行队列一同执行, 因为如果 新增的属性之前并未被响应式则需要设置响应式并让该 target 存储的 new Dep 广播到(渲染 watcher 并不存在该新增属性,因此不会访问到该数据,所以需要利用 new Dep).总的来说就是为 Vue.set 和 Vue.delete 量身定制的!!!!!!
 *    defineReactive 里的 new Dep 用于创建对象数据的属性的数据保留的发布者，并设置属性响应式
 *        对象数据存在 __ob__ 属性指向 Dep，对象数据的属性值存在闭包的 Dep
 *        例如 vm.$options._data 为 {message: {nestMessage: 'Hello Vue'}’
 *            vm.$options._data.__ob__ 存在对象数据保留的发布者
 *            vm.$options._data.message 存在闭包数据保留的发布者，并设置属性响应式
 *            vm.$options._data.message.nestMessage.__ob__ 存在对象数据保留的发布者
 *            vm.$options._data.message.nestMessage 存在闭包数据保留的发布者，并设置属性响应式
 *
 * 对象通过 new Observe 设置数据响应式，非对象数据通过 defineReactive 设置数据响应式
 *
 * 依赖收集：
 *    数据设置为响应式会创建闭包数据保留的发布者和数据下的对象数据保留的发布者，当数据被访问时，闭包数据保留的发布者和数据下的对象数据保留的发布者会收集对应的当前正执行的 vm 组件订阅者。
 *    observe --> new Observe --> defineReactive --> new Dep, childOb
 *    get --> dep.depend(), childOb.dep.depend()
 * 派发更新：
 *    当数据值被修改时，闭包数据保留的发布者执行广播（注意对象数据发布这时不会执行广播）让每个 vm 组件订阅者执行视图操作。
 *    set --> dep.notify() --> subs[i].update()(即 watcher.update()) --> queueWatcher --> flushSchedulerQueue --> watcher.run() --> this.get()(即 watcher.get()) --> this.getter.call(vm)
 * 通过观察者模式的发布者实现数据与 vm 实例的不耦合关联。
 *
 * 总的来说:
 *    依赖收集: reactive get 会让获取该数据的 watcher 订阅者订阅该数据存储的 Dep 发布者
 *    派发更新: reactive set 会让该数据改变促使该数据保存的 Dep 发布者广播所有订阅过的 watcher 订阅者执行 update 操作
 * 订阅者就是发布者的依赖, 即 Dep 含有多个 watcher 依赖
 */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOWn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

export let shouldObserve: boolean = true//设置数据设置为响应式操作时是否能创建数据 observe, 即该数据是否能作为被观察者（发布者）用于触发视图变化
export function toggleObserving(value: boolean) {
  shouldObserve = value
}

/**
 * 数据 Observe 类
 *  数据 observe 会保留发布者 Dep
 *  通过发布者的广播可以触发 vm 实例订阅者 watcher 执行操作,达到数据驱动视图的更新, 实现了数据和视图不耦合
 *  通过 Dep.target 可以获取当前执行操作的 vm 订阅者, 通过 pushTarget 操作设置当前 vm 订阅者, 再通过发布者的 depend 让该 vm 订阅者订阅该发布者, 达到数据的变化影响发布者 --> 发布者通过广播影响 vm 订阅者 --> vm 订阅者再通过 vnode 操作改变视图
 *  把数据设置为 obeserve 实例, 如果数据为可以使用变异 arrayMethods 的变异方法对数组元素数据的变化进行响应式处理,并进行 ob.dep.notify() 对订阅该数组数据存储的 Dep 广播订阅者 watcher 执行 update 操作, 达到实现数组变化更新视图.还有一个作用就是作用于 Vue.set 和 Vue.delete
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number;

  constructor(value: any) {
    this.value = value
    this.dep = new Dep()//发布者
    this.vmCount = 0//使用当前数据作为根数据的 vm 实例数, 即与该数据相关的 Vue 组件数
    def(value, '__ob__', this)//设置 value.__ob__ 并设置为不可枚举的

    if (Array.isArray(value)) {
      // 如果数据为数组则设置原型继承变异数组原型对象, 达到使用变异的数组方法
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 数组数据下的各个数组元素数据创建数据 observe(数组不设置数据响应式, 数组下的非数组元素设置响应式)
      this.observeArray(value)
    } else {
      // 如果数据不为数组为普通对象, 则设置数据和数据下的数据递归设置响应式, 注意, 根数据和非数组对象下的数据不需要设置为订阅者, 根数据和跟数据下的数组数据都要设置一个数据 observe
      this.walk(value)
    }
  }

  /**
   * 设置对象数据响应式
   * @param {Object} obj
   */
  walk(obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // value.__ob__ 不可枚举，因此不会遍历到该属性
      defineReactive(obj, keys[i])
    }
  }

  // 数组数据依次创建各个数组元素数据的数据 observe
  observeArray(items: Array<any>) {
    for (let i = 0, l = items.length; i++) {
      observe(items[i])
    }
  }
}

// 原型继承, 即设置 target 的原型对象为 src
function protoAugment(target, src: Object) {
  target.__proto__ = src
}
// 原型继承的 polyfill
function copyAugment(target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * 创建数据以及数据下的数据的数据 observe, 设置数据以及数据下的对象为响应式, 并设置数据为响应式
 * @param {any} value 数据
 * @param {?boolean} asRootData 是否是根数据, 例如 vm.data 就是根数据, 而根数据下的 vm.data.name 就不是根数据
 */
export function observe(value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * 设置数据值响应式，创建数据值发布者，并递归为数据下的数据创建数据 observe和数据值发布者
 * @param {*} obj
 * @param {*} key
 * @param {*} val
 * @param {*} customSetter
 * @param {*} shallow
 */
export function defineReactive(
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()//创建非对象数据 observe

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)//递归对 val 下的数据递归进行 observe 创建对象数据 observe
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    //获取数据值
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val//获取数据值
      if (Dep.target) {
        dep.depend()//正执行的订阅者 watcher(例如 Component-1 组件的 vm 实例订阅者) 订阅该发布者, 即该数据的变化会影响到哪些组件都通过该发布者去触发 vm 实例订阅者即与该数据有关系的组件更新视图变化, 即下方 set 函数的 dep.notify 操作
        // 递归对 value 下的数据进行 depend, 主要为 Vue.set 和 Vue.delete 函数量身定制的!!!!!!
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    //设置数据值
    set: function reactiveSetter(newVal) {
      const value = getter ? getter.call(obj) : val//获取数据值
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()//执行自定义的 setter 函数
      }
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      dep.notify()//有数据更新, 发布者广播触发 vm 订阅者执行操作触发视图变化
    }
  })
}

/**
 * 设置存在数据 observe的数据的变化进行响应式绑定, 再进行发布者广播
 * @param {Array<any> | Object} target
 * @param {any} key
 * @param {any} val
 */
export function set(target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null or primitive value: ${(target: any)}`)
  }

  // 如果 target 为数组, 并且 key 为数组下标, 则数组 target 设置为 key 长度, 并插入 val 到数组 target 作为最后一个数组元素并返回 val
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }

  // 如果 target 为非数组对象, 并且 target[key] 存在则直接返回 target[key]
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }

  const ob = (target: any).__ob__//当前数据 observe

  // 如果 target 为 vm 实例或者 vm 实例的根数据
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option'
      return val
    )
  }

  // 如果当前数据 observe 不存在则直接返回 target[key]
  if (!ob) {
    target[key] = val
    return val
  }

  // 如果当前数据 observe存在则设置数据 val 响应式
  defineReactive(ob.value, key, val)
  ob.dep.notify()//有数据更新, 发布者广播触发 vm 订阅者执行操作触发视图变化
  return val
}

/**
 * 设置存在数据 observe的数据的删除进行数据删除, 再进行发布者广播
 * @param {*} target
 * @param {*} key
 */
export function del(target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on ubdefined, null or primitive value: ${(target: any)}`)
  }

  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return val
  }

  const ob = (target: any).__ob__

  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting reactive properties to a Vue instance or its root $data ' +
      '- just it to null'
      return val
    )
  }

  if (!hasOwn(target, key)) {
    return
  }

  delete target[key]
  if (!ob) {
    return val
  }
  ob.dep.notify()//有数据删除操作导致更新, 发布者广播触发 vm 订阅者执行操作触发视图变化
}

/**
 * 设置正执行的 vm 订阅者订阅发布者, 订阅的发布者是指存在于数据 observe的数组数据的各个元素的订阅者(不是该数组订阅者, 是数组的数组元素的订阅者)订阅的发布者, 使得数组元素与该 vm 实例(Vue 组件)存在关系
 * @param {Array<any>} value
 */
function dependArray(value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}

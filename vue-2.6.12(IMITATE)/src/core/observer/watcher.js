/* @flow */

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  noop
} from '../util/index'

import { traverse } from './traverse'
import { queueWatcher } from './scheduler'
import Dep, { pushTarget, popTarget } from './dep'

import type { SimpleSet } from '../util/index'

let uid = 0

/**
 * vm, vm.$options.computed[key], user watcher 观察者(Vue 实例, vm.$options.computed[key], user watcher 观察者也称用户 watcher, 订阅者)
 * user watcher 指的是 $options.watch[key], vm 观察者就是渲染 watcher 即 vm._watcher, 而 vm._watchers 则保存所有类型的 watcher
 *
 * vm watcher 通过 watcher.vm._watcher(存储渲染 watcher) === watcher 判断, computed watcher 通过 watcher.lazy 是否为 true 判断(dirty 属性与之相关), user watcher 通过 watcher.user 是否为 true 判断
 *
 * 依赖收集: reactive get 会让获取该数据的 watcher 订阅者订阅该数据存储的 Dep 发布者
 * 派发更新: reactive set 会让该数据改变促使该数据保存的 Dep 发布者广播所有订阅过的 watcher 订阅者执行 update 操作
 */
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;// 深度 user watcher, 用于深度绑定数据
  user: boolean;// 是否是 user watcher, 即是否是 $options.watch[key]
  lazy: boolean;// 是否不在构造函数触发 get 获取 value
  sync: boolean;// 用于 user, 在数据更新时(不是指数据初始加载)优先执行该 watcher 的 update --> run
  dirty: boolean;// 如果通过 evaluate 获取过 this.value 则返回 false, 否则返回 true, 通过 update 时再次设置为 true 等待执行 evaluate 获取 computed[key] 的最新值
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor(
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean//是否为渲染 watcher 即 vm watcher
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this// 存储渲染 watcher
    }
    vm._watchers.push(this)// 存储渲染 watcher 和 Computed watcher，以及 watcher
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid
    this.active = true//设置该订阅者是否激活
    this.dirty = this.lazy//用于 computed watcher
    this.deps = []//观察者目标(发布者)集合
    this.newDeps = []//新观察者目标(新发布者)集合
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''

    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only acceptssimple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    // 如果是 computed watcher 则延后获取 value, 而 user watcher, vm watcher(渲染 watcher)创建该 watcher 实例时在执行构造函数时就获取 value
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * 增加发布者
   * 增加观察者目标集合, 并同步新观察者目标集合
   * @param {Dep} dep
   */
  addDep(dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  /**
   * 更新发布者，清空 newDeps，deps 保留当前执行后最新的订阅的数据发布者集合，即把 vm 组件上一次存在但这一次执行不存在（已不相关）的数据发布者清除
   * 更新观察者目标集合(通过新的观察者目标集合清除已不存在的观察者目标, 同时在清除的观察者目标中清除该观察者)
   */
  cleanupDeps() {
    // 观察者目标集合 deps 中, 已不在新的观察者目标集合 newDeps 的观察者目标依次清除该观察者 watcher
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }

    // 置换 depIds --> newDepIds, 并清除 newDepIds 的收集的所有观察者目标 ID
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()

    // 置换 deps --> newDeps, 并清除 newDeps 的收集的所有观察者目标
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * 获取 value, 订阅相关的数据发布者
   */
  get() {
    pushTarget(this)//设置当前订阅者为正执行的订阅者，即当渲染当前 watcher(componment, computed, watcher) 时设置当前订阅者为正执行的 watcher 的订阅者
    let value
    const vm = this.vm
    try {
      value = this.getter.call(vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      if (this.deep) {
        traverse(value)
      }
      popTarget()//执行完毕, 把正执行的观察者推出正执行的观察者执行栈
      this.cleanupDeps()//每次获取到相应的数据值之后, 更新已经订阅的数据发布者(被观察者, 观察者目标), 打个比喻, 获取当前后绿灯指示过了这个红绿灯后获取下一个红绿灯的指示需要更新, 把上一次红绿灯信号清除, 并接收当前红绿灯指示(被观察者: 红绿灯, 观察者: 各个车辆)
    }
    return value
  }

  /**
   * 更新 value
   */
  update() {
    if (this.lazy) {
      // computed watcher 只会执行这一步
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      // vm watcher 或者 user watcher
      queueWatcher(this)
    }
  }
  run() {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        isObject(value) ||
        this.deep
      ) {
        const oldValue = this.value
        this.value = value
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * 获取 value
   */
  evaluate() {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * 让正执行的观察者订阅该 watcher 实例订阅的所有发布者，让该 watcher 的变化会触发发布者一旦广播能让正执行的观察者产生视图变化
   */
  depend() {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * 拆卸, 设置该订阅者不激活, vm 实例挂载的观察者集合中删除该订阅者, 订阅者订阅的发布者集合中删除该订阅者
   */
  teardown() {
    if (this.active) {
      if (!this.vm._isBeingDestoryed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}

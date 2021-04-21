/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * 观察者目标(数据/vm实例)(发布者, 被观察者)
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor() {
    this.id = uid++
    this.subs = []//观察者集合(订阅者集合)
  }

  // 增加观察者
  addSub(sub: Watcher) {
    this.subs.push(sub)
  }

  // 删除观察者
  removeSub(sub: Watcher) {
    remove(this.subs, sub)
  }

  // 观察者目标(发布者)让正执行的观察者(订阅者)订阅它(即该观察者目标(发布者))
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  // 观察者目标广播通知所有已经订阅的观察者(发布者广播订阅者)
  notify() {
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production') {
      subs.sort((a, b) => a.id - b.id)//从小到大排序，确保 vm 订阅者排在最后一位
    }
    for (let i = 0, l = sub.length; i < l; i++) {
      subs[i].update()
    }
  }
}

Dep.target = null//正执行的 vm 观察者(正执行的订阅者, 即与当前执行操作的 Vue 组件相关), 注意, 全局每次只有一个 watcher 订阅者执行, 即当前组件, 例如 Component-1, 而每个组件都有相应的数据, 总的来说, Dep.target 就是 vm 订阅者和 数据 observer 的桥梁(访问者模式的实现)
const targetStack = []//正执行的观察者执行栈(正执行的订阅者执行栈)，用于嵌套组件

/**
 * 执行开始, 设置正执行的观察者，并推入正执行的观察者执行栈(设置正执行的订阅者). 关于 pushTarget() 则说明 pushTarget() 下面的操作与各个 watcher 无关.
 * @param {?Watcher} target
 */
export function pushTarget(target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

/**
 * 执行完毕, 把正执行的观察者推出正执行的观察者执行栈, 设置下一个正执行的观察者(设置下一个正执行的订阅者)
 */
export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}

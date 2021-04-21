/* @flow */

import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)// 变异数组原型对象, 主要用于响应式的数组元素变化能触发发布者广播(手动派发更新)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

methodsToPatch.forEach(function (method) {
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator(...args) {
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break;
      case 'splice':
        inserted = args.slice(2)
        break;
    }
    // 如果数组数据下的数据元素数据有新增则为新增的数组元素数据创建数据 observer,即把新增的数据设置为观察者
    if (inserted) ob.observeArray(inserted)
    ob.dep.notify()//当前数组订阅者(非数组元素)订阅的发布者广播, 触发 vm 实例的观察者执行操作达到视图更新
    return result
  })
})

/* @flow */

import type Watcher from './watcher'
import config from '../config'
import { callHook, activateChildComponent } from '../instance/lifecycle'

import {
  warn,
  nextTick,
  devtools,
  inBrowser,
  isIE
} from '../util/index'

export const MAX_UPDATE_COUNT = 100

const queue: Array<Watcher> = []
const activatedChildren: Array<Component> = []
let has: { [key: number]: ?true } = {}
let circular: { [key: number]: number } = {}
let waiting = false
let flushing = false
let index = 0//当前正执行 watcher update 的 queue 里的 watcher 下标

// 所有 watcher update 操作执行完毕，重置各个标志位
function resetSchedulerState() {
  index = queue.length = activatedChildren.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
  waiting = flushing = false
}

// 函数, 获取当前页面生成截止至目前的时间戳
export let currentFlushTimestamp = 0
let getNow: () => number = Date.now
if (inBrowser && !isIE) {
  const performance = window.performance
  if (
    performance &&
    typeof performance.now === 'function' &&
    getNow() > document.createEvent('Event').timeStamp//document.createEvent('Event').timeStamp 表示当前页面生成 Event 截止至目前的时间的时间戳，时间戳从页面生成开始算
  ) {
    getNow = () => performance.now()//当前页面生成截止至目前的时间戳
  }
}

// 依次执行所有 watcher update 队列
function flushSchedulerQueue() {
  currentFlushTimestamp = getNow()
  flushing = true
  let watcher, id

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort((a, b) => a.id - b.id)//根据 id 从小到大排序,原因如英文注释所示, 确保渲染 wather 排在 user watcher 和父组件 watcher 后一个执行. 在每个组件中 vm watcher 相对于 user watcher 和父组件 watcher 是最后创建的所以 id 最大放最后.最终顺序为: 父组件各个 watcher, 当前组件 computed watcher, 当前组件  user watcher, 当前组件渲染 watcher

  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    if (watcher.before) {
      watcher.before()
    }
    id = watcher.id
    has[id] = null
    watcher.run()

    // 如果执行 watcher update 队列发现无限循环则报错, 例如针对 user watcher 出现的再次设置 vm 响应式数据出现的 Vue 内部执行队列死循环
    /**
     * 例如以下设置可以复现该错误
     *    $options.watch = {
     *      newMessage(){
     *        this.message = Math.random()
     *      }
     *    }
     */
    if (process.env.NODE_ENV !== 'production' && has[id] !== null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`
          ),
          watcher.vm
        )
        break;
      }
    }
  }

  const activatedQueue = activatedChildren.slice()
  const updatedQueue = queue.slice()

  resetSchedulerState()

  callActivatedHooks(activatedQueue)

  // 执行 vm 的 updated 钩子
  callUpdatedHooks(updatedQueue)

  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
}

// 执行 vm 的 updated 钩子
function callUpdatedHooks() {
  let i = queue.length
  while (i--) {
    cosnt watcher = queue[i]
    const vm = watcher.vm
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestoryed) {
      callHook(vm, 'updated')
    }
  }
}

export function queueActivatedComponent(vm: Component) {
  vm._inactive = false
  activatedChildren.push(vm)
}

function callActivatedHooks(queue) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true
    activateChildComponent(queue[i], true)
  }
}

// watcher update 执行队列(响应式数据更新导致派发更新时才会执行这个,而非初始加载时)
export function queueWatcher(watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      // 执行队列未收集完时继续收集
      queue.push(watcher)
    } else {
      // 执行队列未收集完在执行 watcher update 操作的过程中渲染 watcher（vm._watcher）的 render 操作导致又再次执行 queueWatcher
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }

    // waiting 标志位用于确保每次只执行一次下面的操作，包含 nextTick(flushSchedulerQueue)
    if (!waiting) {
      waiting = true

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      // 确保把所有 watcher update 执行队列收集完在下一个 tick 统一执行所有 watcher update 操作, 避免每次数据更新每次都执行渲染 watcher 改变视图, 使得每次只会所有数据更新完后执行一次所有 watcher update(包括左后才执行渲染 watcher update 改变视图). 总的来说就是确保每次所有数据的派发更新收集完后都统一只执行一次执行队列去让所有相关的 watcher 执行 update 操作
      nextTick(flushSchedulerQueue)
    }
  }
}

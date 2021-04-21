/* @flow */

/**
 * 在JavaScript中，任务被分为Task（又称为MacroTask,宏任务）和MicroTask（微任务）两种。它们分别包含以下内容：
 * MacroTask: script(整体代码)，setTimeout，setInterval，setImmediate（node独有），MessageChannel，I/O，UI rendering
 * MicroTask: process.nextTick（node独有），Promises（new Promise()内的程序是同步代码，而 then 部分的程序才是 MicroTask 任务），Object.observe(废弃)，MutationObserver
 * 在同一个上下文（执行环境）中，总的执行顺序为执行同步代码—>microTask—>macroTask
 *
 * 例子：
 *   setTimeout(function () {
 *       console.log(1);
 *   },0);
 *   console.log(2);
 *   process.nextTick(() => {
 *       console.log(3);
 *   });
 *   new Promise(function (resolve, rejected) {
 *       console.log(4);
 *       resolve()
 *   }).then(res=>{
 *       console.log(5);
 *   })
 *   setImmediate(function () {
 *       console.log(6)
 *   })
 *   console.log('end');
 *   返回： 2、4、end、3、5、1、6
 */
import { noop } from 'shared/util.js'
import { handlerError } from './error
import { isIE, isIOS, isNative } from './env'

export let isUsingMicroTask = false

const callbacks = []
let pending = false

/**
 * 执行 callbacks 内的所有回调，把 callbacks 清空，并置 pending 待定状态为 false 表示已执行
 */
function flushCallbacks() {
  pending = false
  const copies = callbacks.silce(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// 确定 timerFunc
let timerFunc
if (typeof Promise !== undefined && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (
  !isIE && typeof MutationObserver !== 'undefined' &&
  (isNative(MutationObserver) || MutationObserver.toString() === '[object MutationObserverConstructor]')
) {
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, { characterData: true })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

/**
 * nextTick，pending 用于确定每次 nextTick 执行完才会执行下一次 nextTick
 * @param {Function} cb
 * @param {Object} ctx
 */
export function nextTick(cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}

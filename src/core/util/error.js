/* @flow */

import config from '../config'
import { warn } from './debug'
import { inBrowser, inWeex } from './env'
import { isPromise } from 'shared/util.js'
import { pushTarget, popTarget } from '../observer/dep'

/**
 * 错误警告函数
 * @param {Error} err
 * @param {any} vm
 * @param {string} info
 */
export function handleError(err: Error, vm: any, info: string) {
  pushTarget()
  try {
    if (vm) {
      let cur = vm
      while ((cur = cur.$parent)) {
        const hooks = cur.$options.errorCaptured
        if (hooks) {
          for (let i = 0; i < hooks.length; i++) {
            try {
              const capture = hooks[i].call(cur, err, vm, info) === false
              if (capture) return
            } catch (e) {
              globalHandleError(e, cur, 'errorCaptured hook')
            }
          }
        }
      }
    }
    globalHandleError(err, vm, info)
  } finally {
    popTarget()
  }
}

function globalHandleError(err, vm, info) {
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info)
    } catch (e) {
      if (e !== err) {
        logError(e, null, 'config.errorHandler')
      }
    }
  }
  logError(err, vm, info)
}

function logError(err, vm, info) {
  if (process.env.NODE_ENV !=== 'production') {
    warn(`Error in ${info}: "${err.toString()}"`, vm)
  }
  if ((inBrowser || inWeex) && typeof console !== 'undefined') {
    console.error(err)
  } else {
    throw err
  }
}

export function invokeWithErrorHandling(
  handler: Function,
  context: any,
  args: null | any[],
  vm: any,
  info: string
) {
  let res
  try {
    res = args ? handler.apply(context, args) : handler.call(context)
    if (res && !res._isVue && isPromise(res) && !res._handled) {
      res.catch(e => handleError(e, vm, info + ` (Promise/async)`))
      res._handled = true//res._handled 标志位用于只执行一次错误函数
    }
  } catch (e) {
    handleError(e, vm, info)
  }
  return res
}

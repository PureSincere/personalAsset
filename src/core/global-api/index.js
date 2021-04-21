/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/util.js'
import builtInComponent from '../components/index'
import { observe } from 'core/observer/index.js'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

/**
 * 初始化 Vue，设置 Vue 的各个属性
 * @param {*} Vue
 */
export function initGlobalAPI(Vue: GlobalAPI) {
  // 设置 Vue.config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set() => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // 设置 Vue.util
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  // 设置 Vue.set
  // 设置 Vue.delete
  // 设置 Vue.nextTick
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  /**
   * 设置 Vue.options
   *  设置 Vue.options.components
   *  设置 Vue.options.directives
   *  设置 Vue.options.filters
   *  设置 Vue.options._base
   */
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })
  Vue.options._base = Vue
  // 设置 Vue.options.components.KeepAlive
  extend(Vue.options.components, builtInComponent)

  // 设置 Vue.use
  initUse(Vue)

  // 设置 Vue.mixin
  initMixin(Vue)

  // 设置 Vue.cid
  // 设置 Vue.extend
  initExtend(Vue)

  // 设置 Vue.component, Vue.directive, Vue.filter
  initAssetRegisters(Vue)
}

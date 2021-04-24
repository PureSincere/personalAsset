/* @flow */

import { mergeOptions } from '../util/index'

/**
 * 设置 Vue.mixin 函数
 * @param {*} Vue
 */
export function initMixin(Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)//合并配置项并设置组件 options 为合并后的配置项达到混合配置项的目的
    return this
  }
}

/* @flow */

import { ASSET_TYPES } from 'shared/util'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'

/**
 * 设置 Vue.cid
 * 设置 Vue.extend 函数
 * @param {*} Vue
 */
export function initExtend(Vue: GlobalAPI) {

  Vue.cid = 0//cid 表示 component id，即组件 ID, Vue.cid = 0 余下的组件 ID 自增
  let cid = 1//确保每一个组件都有唯一 ID

  // 生成一个以当前上下文代表的组件作为原型的构造函数
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}
    const Super = this
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})// 存储针对不同的父组件生成的构造器
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    const name = extendOptions.name || Super.options.name

    // 校验组件名称命名格式是否符合规范，或者，是否是内置标签或者HTML标签
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }

    const Sub = function VueComponent(options) {
      this._init(options)
    }
    // Sub.prototype.__proto__ = Super.prototype
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(Super.options, extendOptions)
    Sub['super'] = Super

    if (Sub.options.props) {
      // 设置 Sub.prototype.key => this[_props].key
      initProps(Sub)
    }
    if (Sub.options.computed) {
      // 设置 Sub.prototype.key => this[Sub.options.computed].key
      initComputed(Sub)
    }

    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // Sub.component = Super.component
    // Sub.directive = Super.directive
    // Sub.filter = Super.filter
    ASSET_TYPES.forEach(function (type) => {
      Sub[type] = Super[type]
    })
    if (name) {
      Sub.options.components[name] = Sub
    }

    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // 缓存组件的合并后的构造器，即每个组件只允许一个合并后的构造器
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

/**
 * 设置 component.prototype.key => this[_props].key
 * @param {*} Comp
 */
function initProps(Comp) {
  const props = comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

/**
 * 设置 component.prototype.key => this[component.options.computed].key
 * @param {*} Comp
 */
function initComputed(Comp) {
  const props = comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}

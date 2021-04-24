import { initMinix } from "./init"
import { stateMinix } from "./state.js"
import { eventsMinix } from "./events"
import { lifecycleMinix } from "./lifecycle"
import { renderMinix } from "./render"

import { warn } from '../util/index'

/**
 * Vue 构造函数
 * @param {*} options
 */
function Vue(options) {
  if (process.env.NODE_ENV !== 'production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

// 设置 Vue.prototype._init
initMinix(Vue)
/**
 * 设置 Vue.prototype.$data
 * 设置 Vue.prototype.$props
 * 设置 Vue.prototype.$set
 * 设置 Vue.prototype.$delete
 * 设置 Vue.prototype.$watch
 */
stateMinix(Vue)
/**
 * 设置 Vue.prototype.$on
 * 设置 Vue.prototype.$once
 * 设置 Vue.prototype.$off
 * 设置 Vue.prototype.$emit
 */
eventsMinix(Vue)
/**
 * 设置 Vue.prototype._update
 * 设置 Vue.prototype.$forceUpdate
 * 设置 Vue.prototype.$destory
 */
lifecycleMinix(Vue)
/**
 * 设置 Vue.prototype.$nextTick
 * 设置 Vue.prototype._render
 * 设置 Vue.prototype._o
 * 设置 Vue.prototype._n
 * 设置 Vue.prototype._s
 * 设置 Vue.prototype._l
 * 设置 Vue.prototype._t
 * 设置 Vue.prototype._q
 * 设置 Vue.prototype._i
 * 设置 Vue.prototype._m
 * 设置 Vue.prototype._f
 * 设置 Vue.prototype._k
 * 设置 Vue.prototype._b
 * 设置 Vue.prototype._v
 * 设置 Vue.prototype._e
 * 设置 Vue.prototype._u
 * 设置 Vue.prototype._g
 * 设置 Vue.prototype._d
 * 设置 Vue.prototype._p
 */
renderMinix(Vue)

export default Vue

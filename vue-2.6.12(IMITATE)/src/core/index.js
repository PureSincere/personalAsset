import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'

/**
 * 设置 Vue.config
 * 设置 Vue.util
 * 设置 Vue.set
 * 设置 Vue.delete
 * 设置 Vue.nextTick
 * 设置 Vue.options
 *  设置 Vue.options.components
 *  设置 Vue.options.directives
 *  设置 Vue.options.filters
 *  设置 Vue.options._base
 * 设置 Vue.use
 * 设置 Vue.mixin
 * 设置 Vue.extend
 * 设置 Vue.component, Vue.directive, Vue.filter
 */
initGlobalAPI(Vue)

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get() {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})

Vue.version = '__VERSION__'

export default Vue


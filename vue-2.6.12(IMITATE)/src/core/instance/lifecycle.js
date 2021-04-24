/* @flow */

import config from '/config'
import Watcher from '../observer/watcher'
import { mark, measure } from '../util/pref'
import { createEmptyVNode } from '../vdom/vnode'
import { updateComponentListeners } from './events'
import { resolveSlots } from './render-helpers/resolve-slots'
import { toggleObserving } from '../observer/index'
import { pushTarget, popTarget } from '../observer/dep'

import {
  warn,
  noop,
  remove,
  emptyObject,
  validateProp,
  invokeWithErrorHandling
} from '../util/index'


// 设置当前激活的 vm
export let activeInstance: any = null
/**
 * 设置当前激活的 vm, 并保存上一次激活的 vm, 当执行函数时设置上一次激活的 vm 为当前激活的 vm,
 *  例如
 *    setActiveInstance(a) --> activeInstance 为 a 实例
 *    setActiveInstance(b) --> activeInstance 为 b 实例
 *    setActiveInstance() --> activeInstance 为 a 实例
 * @param {Component} vm
 */
export function setActiveInstance(vm: Component) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}

/**
 * 设置 vm.$parent
 * 设置 vm.$root
 * 设置 vm.$children
 * 设置 vm.$refs
 * 设置 vm._watcher
 * 设置 vm._inactive
 * 设置 vm._directInactive
 * 设置 vm._isMounted
 * 设置 vm._isDestoryed
 * 设置 vm._isBeingDestoryed
 * @param {Component} vm
 */
export function initLifeCycle(vm: Component) {
  const options = vm.$options

  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestoryed = false
  vm._isBeingDestoryed = false
}

/**
 * 设置 Vue.prototype._update
 * 设置 Vue.prototype.$forceUpdate
 * 设置 Vue.prototype.$destory
 * @param {Class<Component>} Vue
 */
export function lifecycleMixin(Vue: Class<Component>) {
  /**
   * 设置 vm._vnode
   * 设置 vm.$el
   * @param {VNode} vnode
   * @param {boolean} hydrating
   */
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    // 保留未更新前的 vm 的 $el 和 vnode 实例
    const prevEl = vm.$el
    const prevVnode = vm._vnode

    const restoreActiveInstance = setActiveInstance(vm)// 每个实例 _update 过程中都会激活当前 vm, 并保存上一次激活的 vm
    vm._vnode = vnode

    if (!prevVnode) {
      // 第一次比较，不存在上一次 vnode，即初始化页面的时候
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false)
    } else {
      // 上一次 vnode 和最新的 vnode 比较
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    restoreActiveInstance()

    // 把更新前的 el DOM 绑定的 __vue__ 清空, 并设置当前绑定的 el DOM 的 __vue__ 为更新后的 vm
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm
    }

    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
  }

  /**
   *
   */
  Vue.prototype.$forceUpdate = function () {
    const vm: Component = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }

  /**
   * 设置 vm._isBeingDestoryed
   * 设置 vm._isDestoryed
   */
  Vue.prototype.$destory = function () {

    const vm: Component = this
    if (vm._isBeingDestoryed) {
      return
    }
    callHook(vm, 'beforeDestory')
    vm._isBeingDestoryed = true
    const parent = vm.$parent
    if (parent && !parent._isbeingDestoryed && !vm.$options.abstract) {
      remove(parent.$children, vm)
    }

    if (vm._watcher) {
      vm._watcher.teardown()
    }
    let i = vm._watchers.length
    while (i--) {
      vm._watchers[i].teardown()
    }

    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--
    }

    vm._isDestoryed = true

    vm.__patch__(vm.vnode, null)

    callHook(vm, 'destoryed')

    vm.$off()

    if (vm.$el) {
      vm.$el.__vue__ = null
    }

    if (vm.$vnode) {
      vm.$vnode.parent = null
    }
  }
}

export function mountComponent(
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  // 设置 vm.$el
  vm.$el = el

  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }

  callHook(vm, 'beforeMount')

  // 创建 updateComponent 函数
  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    /**
     * 当执行第一次挂载到 DOM(非组件)
     *    vm.$mount --> mountComponent --> new Watcher --> get() --> updateComponent() --> vm._update(vm._render(), hydrating)
     *        --> 创建新的 vnode(执行过程从子到父): vm._render() --> vm.$options.render.call(vm._renderProxy, vm.$createElement) --> createElement(vm, a, b, c, d, true) --> _createElement
     *            --> 创建非组件 vnode: new VNode --> vnode
     *            --> 创建组件 vnode: createComponent
     *        --> 对比 oldVnode 和 vnode 并对 DOM 打补丁 patch: vm._update --> vm.__patch__ --> patch --> createElm --> 执行 insert 插入到 DOM
     *
     * 当执行第一次挂载到 DOM(组件)
     *  let vm = new Vue({
          el: '#app',
          components: {
            App: {
              data() {
                return {
                  message: 'Hello App Clild'
                }
              },
              render(h) {
                return h('div', {
                  attrs: {
                    id: "#app-child-1"
                  },
                }, this.message)
              }
            }
          },
          render(h) {
            return h('App')
          }
        })
     *    vm.$mount --> mountComponent --> new Watcher --> get() --> updateComponent() --> vm._update(vm._render(), hydrating)
     *        --> 创建新的 vnode(执行过程从子到父): vm._render() --> vm.$options.render.call(vm._renderProxy, vm.$createElement) --> h('App') --> createElement(vm, a, b, c, d, true) --> _createElement --> 创建组件 vnode: createComponent
     *        --> vm._update --> vm.__patch__ --> patch --> createElm --> createComponent --> vnode.data.hook.init --> componentVNodeHooks.init --> 创建组件 vm 实例 createComponentInstanceForVnode --> init --> ... --> child.$mount --> ...
     *            --> vm._render() --> vm.$options.render.call(vm._renderProxy, vm.$createElement) --> render(h) {return h('div', {attrs: {id: "#app-child-1"}}, this.message)} --> createElement(vm, a, b, c, d, true) --> _createElement --> new VNode --> vnode
     *            --> vm._update --> vm.__patch__ --> patch --> createElm --> createChildren -->  将 App 组件内的 vnode 生成的节点插入到 App 的 div 节点: insert --> ... --> 因为 parentElm 不存在则执行 insert 并没有插入到 DOM
     *            --> 回到 [createComponent] initComponent --> vnode.elm = vnode.componentInstance.$el --> insert --> 插入到 DOM
     *    总结: 创建 vnode 从父到子, 并在 patch 过程通过 createElm 执行 createComponent 的 init 过程一层一层从父到子创建组件 vm 实例, 最终插入从子到父
     */
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  }

  // 渲染 watcher
  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, {
    before() {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}

export function callHook(vm: Component, hook: string) {
  pushTarget()
  const handlers = vm.$options[hook]
  const info = `${hook} hook`
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, null, vm, info)
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  popTarget()
}

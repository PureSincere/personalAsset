/*!
 * Vue.js v2.6.12 学习版本
 * (c) 2014-2020 Evan You
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  /*  */

  // import { initLifecycle } from './lifecycle'
  // import { initEvents } from './events'
  // import { initRender } from './render'

  let uid = 0;

  function initMinix(Vue) {
    Vue.prototype._init = function (options) {
      const vm = this;
      vm._uid = uid++;
    };

    vm._isVue = true;

    vm.$options = options;

    vm._self = vm;


    // initLifecycle(vm)// 初始化生命周期
    // initEvents(vm)//初始化事件中心
    // initRender(vm)//初始化渲染

    // 挂载 VM
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  }

  // import { warn } from '../util/index'

  function Vue(options) {
    if (process.env.NODE_ENV !== 'production' && !(this instanceof Vue)) {
      warn('Vue is a constructor and should be called with the `new` keyword');
    }
    this._init(options);
  }

  initMinix(Vue);

  /*  */

  const inBrowser = typeof window !== 'undefined';

  /*  */

  function query$1(el) {
    if (typeof el === 'string') {
      const selected = document.querySelector(el);
      return selected
    } else {
      return el
    }
  }

  /*  */

  function mountComponent(
    vm,
    el
  ) {
    vm.$el = el;

    return vm
  }

  /*  */

  Vue.prototype.$mount = function (
    el,
    hydrating
  ) {
    el = el && inBrowser ? query$1(el) : undefined;
    return mountComponent(this, el)
  };

  /*  */

  const mount = Vue.prototype.$mount;
  Vue.prototype.$mount = function (
    el,
    hydrating
  ) {
    el = el && query(el);

    if (el === document.body || el === document.documentElement) {
      return this
    }

    return mount.call(this, el, hydrating)
  };

  return Vue;

})));

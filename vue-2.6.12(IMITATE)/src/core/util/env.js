/* @flow */

export const hasProto = '__proto__' in {}

// 浏览器嗅探
export const inBrowser = typeof window !== 'undefined'
export const inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform
export const weexPlatform = inWeex && WXEnvironment.platform.toLowerCase()
export const UA = inBrowser && window.navigator.userAgent.toLowerCase()
export const isIE = UA && /msie|trident/.test(UA)
export const isIE9 = UA && UA.indexOf('msie 9.0') > 0
export const isEdge = UA && UA.indexOf('edge/') > 0
export const isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android')
export const isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios')
export const isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge
export const isPhantomJS = UA && /phantomJS/.test(UA)
export const isFF = UA && UA.match(/firefox\/(\d+)/)

// firefox 存在 Object.prototype.watch 函数
export const nativeWatch = ({}).watch

/**
 * 检测 target.addEventListener(type, listener, options) 是否支持设置 options.passive
 */
export let supportsPassive = false
if (inBrowser) {
  try {
    const opts = {}
    Object.defineProperty(opts, 'passive', ({
      get() {
        supportsPassive = true
      }
    }: Object))
    window.addEventListener('test-passive', null, opts)
  } catch (e) { }
}

let _isServer
export const isServerRendering = () => {
  if (_isServer === undefined) {
    if (!inBrowser && !inWeex && typeof global !== 'undefined') {
      _isServer = global['process'] && global['process'].env.VUE_ENV === 'server'
    } else {
      _isServer = false
    }
  }
  return _isServer
}

export const devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__

/**
 * 判断是否是内置函数
 * @param {any} Ctor
 */
export function isNative(Ctor: any): boolean {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

export const hasSymbol =
  typeof Symbol !== 'undefined' && isNative(Symbol) && typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys)

/**
 * Set 的 polyfill
 */
let _Set
if (typeof _Set !== 'undefined' && isNative(Set)) {
  _Set = Set
} else {
  _Set = class Set implements SimpleSet {
    set: Object;
    constructor() {
      this.set = Object.create(null)
    }
    has(key: string | number) {
      return this.set[key] === true
    }
    add(key: string | number) {
      this.set[key] = true
    }
    clear() {
      this.set = Object.create(null)
    }
  }
}
export interface SimpleSet {
  has(key: string | number): boolean
  add(key: string | number): mixed
  clear(): void
}
export { _Set }

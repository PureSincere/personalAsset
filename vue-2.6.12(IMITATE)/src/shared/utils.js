/* @flow */

/**
 * 冻结对象，无法修改删除增加对象的属性
 */
export const emptyObject = Object.freeze({})

export function isUndef(v: any): boolean % checks {
  return v === undefined || v === null
}

export function isDef(v: any): boolean % checks {
  return v !== undefined && v !== null
}

export function isTrue(v: any): boolean % checks {
  return v === true
}

export function isFalse(v: any): boolean % checks {
  return v === false
}

/**
 * 判断 value 是否 string, number, symbol, boolean 原始类型
 * @param {*} value
 */
export function isPrimitive(value: any): boolean % checks {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'symbol' ||
    typeof value === 'boolean' ||
  )
}

export function isObject(obj: mixed): boolean % checks {
  return obj !== null && typeof obj === 'object'
}

const _toString = Object.prototype.toString

/**
 * 获取数据类型的文本说明，例如 123 => "[object Number]".slice(8, -1) => "Number"
 * @param {*} value any
 */
export function toRawType(value: any): string {
  return _toString.call(value).slice(8, -1)
}

/**
 * 判断数据类型是否是普通对象类型
 * @param {*} value any
 */
export function isPlainObject(obj: any): boolean {
  return _toString.call(obj) === '[object Object]'
}

export function isRegExp(v: any): boolean {
  return _toString.call(v) === '[object RegExp]'
}

export function isValidArrayIndex(val: any): boolean {
  const n = parseFloat(String(val))
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

export function isPromise(val: any): boolean {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  )
}

export function toString(val: any): string {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
      ? JSON.stringify(val, null, 2)
      : String(val)
}

export function toNumber(val: string): number | string {
  const n = parseFLoat(val)
  return isNaN(n) ? val : n
}

/**
 * 例如 makeMap('slot,component') --> 类似返回函数 (key: string) => ['slot','component'].indexOf(key) !== -1
 *  makeMap('slot,component')('slot') --> true
 *  makeMap('slot,component')('aaaa') --> undefined
 * @param {string} str
 * @param {boolean} expectsLowerCase
 */
export function makeMap(
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  const map = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}

/**
 * 函数，用于判断是否是 Vue 内置标签 slot, component
 */
export const isBuiltInTag = makeMap('slot,component', true)

/**
 * 函数，用于判断是否是保留属性
 */
export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is')

/**
 * 删除数组某个元素（根据某个元素去遍历判断再删除）
 * @param {Array<any>} arr
 * @param {any} item
 */
export function remove(arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

const hasOwnProperty = Object.hasOwnProperty
/**
 * 判断对象是否包含特定的自身（非继承）属性
 * @param {Object | Array<*>} obj
 * @param {string} key
 */
export function hasOwn(obj: Object | Array<*>, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}

/**
 * 通过柯里化返回一个函数，把每次函数结果返回的结果缓存起来，而无需在执行函数直接从缓存获取结果
 * @param {Function} fn
 */
export function cached<F: Function>(fn: F): F {
  const cache = Object.create(null)
  return (function cachedFn(str: string) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }: any)
}

const camelizeRE = /-(\w)/g
/**
 * 把连字符命名格式转化为小驼峰命名格式，例如 vue-name 转变为 vueName
 */
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

/**
 * 把字符串首字母设置为大写
 */
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

const hyphenateRE = /\B([A-Z])/g
/**
 * 把小驼峰命名格式转化为连字符命名格式，例如 vueName 转变为 vue-name
 */
export const hyphenate = cached((str: string): string => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})

/**
 * 函数 bind 的 polyfill
 * @param {Function} fn
 * @param {Object} ctx
 */
function polyfillBind(fn: Function, ctx: Object): Function {
  function boundFn(a) {
    const l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length
  return boundFn
}

function nativeBind(fn: Function, ctx: Object): Function {
  return fn.bind(ctx)
}

export const bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind

/**
 * 拷贝一个类似数组的对象为一个数组，start 表示起始下标，例如 toArray([1,2,3], 1) => [2,3]
 * @param {any} list
 * @param {number} start
 */
export function toArray(list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

/**
 * 浅拓展对象属性
 * @param {Object} to
 * @param {?Object} _from
 */
export function extend(to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}

/**
 * 把数组内的各个对象元素统一合并为一个对象并输出，数组元素后面的元素属性会覆盖前一个元素属性
 * 例如 toObject([{name: "a"}, {prop: "prop"}]) --> {name: "a", prop: "prop"}
 * @param {Array<any>} arr
 */
export function toObject(arr: Array<any>): Object {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

export function noop(a?: any, b?: any, c?: any) { }

export const no = (a?: any, b?: any, c?: any) => false

export const identity = (_: any) => _

export function genStaticKeys(modules: Array<ModuleOptions>): string {
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

/**
 * 比较 a 与 b 是否相等
 * @param {any} a
 * @param {any} b
 */
export function looseEqual(a: any, b: any): boolean {
  if (a === b) return true
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = Array.isArray(a)
      const isArrayB = Array.isArray(b)
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every((e, i) => {
          return looseEqual(e, b[i])
        })
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        return keysA.length === keysB.length && keysA.every(key => {
          return looseEqual(a[key], b[key])
        })
      } else {
        return false
      }
    } catch (e) {
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

/**
 * 获取值在数组中的下标
 * @param {Array<mixed>} arr
 * @param {mixed} val
 */
export function looseIndexOf(arr: Array<mixed>, val: mixed): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}

/**
 * 通过柯里化返回只执行一次的函数
 * @param {Function} fn
 */
export function once(fn: Function): Function {
  let called = false
  return function () {
    if (!called) {
      called = true
      fn.apply(this, arguments)
    }
  }
}

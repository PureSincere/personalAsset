/* @flow */

export const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/

/**
 * 查看是否是保留字符串，开头为 $ 或者 _ 为保留字符串
 * @param {string} str
 */
export function isReserved(str: string): boolean {
  const c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F//0x24 => $, 0x5F => _
}

/**
 * defineProperty
 * @param {Object} aobj
 * @param {string} key
 * @param {any} val
 * @param {boolean} enumerable 默认设置为不可枚举
 */
export function def(obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!emumerable,
    writable: true,
    configurable: true
  })
}

const bailRE = new RegExp(`[^${unicodeRegExp.source}.$_\\d]`)//判断不存在 Unicode, ., $, \, 数字等字符的字符串的正则表达式
/**
 * 用于解析字符串例如 'a.b.c'的引用返回最终实际的 a.b.c 的 c 的值
 * parsePath('a.b')({a: {b: '123'}}) => '123'
 */
export function parsePath(path: string): any {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}

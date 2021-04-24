/* @flow */

import { warn } from './debug'
import { observe, toggleObserving, shouldObserve } from '../observer/index'
import {
  hasOwn,
  isObject,
  toRawType,
  hyphenate,
  capitalize,
  isPlainObject
} from 'shared/util.js'

type PropOptions = {
  type: Function | Array<Function> | null,
  default: any,
  required: ?boolean,
  validator: ?Function
}

/**
 * 验证 propsData[key] 是否符合 propOptions[key] 规范
 * @param {string} key
 * @param {Object} propOptions
 * @param {Object} propsData
 * @param {Component} vm
 */
export function validateProp(
  key: string,
  propOptions: Object,
  propsData: Object,
  vm?: Component
): any {
  const prop = propOptions[key]
  const absent = !hasOwn(propsData, key)
  let value = propsData[key]
  const booleanIndex = getTypeIndex(Boolean, prop.type)//例如 prop.type = [String, Boolean]，则 getTypeIndex(Boolean, prop.type) 为 1
  if (booleanIndex > -1) {
    if (absent && !hasOwn(prop, 'default')) {
      value = false
    } else if (value === '' || value === hyphenate(key)) {
      const stringIndex = getTypeIndex(String, prop.type)
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true
      }
    }
  }
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key)]
    const prevShouldObserve = shouldObserve
    toggleObserving(true)
    observe(value)
    toggleObserving(prevShouldObserve)
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    !(__WEEX__ && isObject(value) && ('@binding' in value))
  ) {
    assertProp(prop, key, value, vm, absent)
  }
  return value
}

/**
 * 获取默认值 prop.default
 * @param {?Component} vm
 * @param {propOptions} prop
 * @param {string} key
 */
function getPropDefaultValue(vm: ?Component, prop: propOptions, key: string): any {
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  const def = prop.default
  if (process.env.NODE_ENV !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    )
  }
  if (
    vm &&
    vm.$options.propData &&
    vm.$options.propData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }

  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

/**
 * 检验 prop 是否符合规范
 * @param {*} prop
 * @param {*} name
 * @param {*} value
 * @param {*} vm
 * @param {*} absent
 */
function assertProp(
  prop: PropOptions,
  name: string,
  value: any,
  vm: ?Component,
  absent: boolean
) {
  if (prop.require && absent) {
    warn(
      'Missing require prop: "' + name + '"',
      vm
    )
    return
  }
  if (value == null && !prop.required) {
    return
  }

  let type = prop.type
  let valid = !type || type === true
  const expectedTypes = []
  if (type) {
    if (!Array.isArray(type)) {
      type = [type]
    }
    for (let i = 0; i < type.length && !valid; i++) {
      const assertedType = assertType(value, type[i])
      expectedTypes.push(assertedType.expectedType || '')
      valid = assertedType.valid
    }
  }

  if（!valid）{
    warn(
      getInvalidTypeMessage(name, value, expectedTypes),
      vm
    )
    return
  }

  const validator = prop.validator
  if (validator) {
    if (!validator(value)) {
      warn(
        `Invalid prop: custom validator check failed for prop ${name}.`,
        vm
      )
    }
  }

}

const simpleCheckRE = /^(String|Number|BOolean|Function|Symbol)$/
/**
 * 判断值 value 是否符合类型 type
 * @param {*} value
 * @param {*} type
 */
function assertType(value: any, type: Function): {
  valid: boolean,
  expectedType: string
} {
  let valid
  const expectedType = getType(type)
  if (simpleCheckRE.test(expectedType)) {
    const t = typeof value
    valid = t === expectedType.toLowerCase()
    if (!valid && t === 'object') {
      valid = value instanceof type
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value)
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value)
  } else {
    valid = value instanceof type
  }
  return {
    valid,
    expectedType
  }
}

/**
 * 获取函数名称
 * @param {*} fn
 */
function getType(fn) {
  const match = fn && fn.toString().match(/^\s*function (\w+)/)
  return match ? match[1] : ''
}

/**
 * 判断是否相同的函数名称
 * @param {*} a
 * @param {*} b
 */
function isSameType(a, b) {
  return getType(a) === getType(b)
}

/**
 * 获取 type 在 expectedTypes 的下标
 * @param {*} type
 * @param {*} expectedTypes
 */
function getTypeIndex(type, expectedTypes): Number {
  if (!Arrray.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (let i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}

/**
 * 获取当 prop 数据类型不合规范时的错误消息
 */
function getInvalidTypeMessage(name, value, expectedTypes) {
  let message = `Invalid prop: type check failed for prop "${name}".` +
    ` Expected ${expectedTypes.map(capitalize).join(', ')}`
  const expectedType = expectedTypes[0]
  const receivedType = toRawType(value)
  const expectedValue = styleValue(value, expectedType)
  const receivedValue = styleValue(value, receivedType)
  if (expectedTypes.length === 1 &&
    isExplicable(expectedType) &&
    !isBoolean(expectedType, receivedType)) {
    message += ` with value ${expectedValue}`
  }
  message += `, got ${receivedType} `
  if (isExplicable(receivedType)) {
    message += `with value ${receivedValue}`
  }
  return message
}

/**
 * 获取格式化指定格式的数据的字符串
 * @param {*} value
 * @param {*} type
 */
function styleValue(value, type) {
  if (type === 'String') {
    return `"${value}"`
  } else if (type === 'Number') {
    return `${Number(value)}`
  } else {
    return `${value}`
  }
}

/**
 * 判断 value 是否为 string, number 或者 boolean
 * @param {*} value
 */
function isExplicable(value) {
  const explicitTypes = ['string', 'number', 'boolean']
  return explicitTypes.some(elem => value.toLowerCase() === elem)
}

function isBoolean(...args) {
  return args.some(elem => elem.toLowerCase() === 'boolean')
}

/* @flow */
/**
 * 整个文件主要在于 mergeOptions 函数
 */
import config from '/config'
import { warn } from '/debug'
import { set } from '../observer/index'
import { unicodeRegExp } from '/lang'
import { nativeWatch, hasSymbol } from '/env'

import {
  ASSET_TYPE,
  LIFECYCLE_HOOKS
} from 'shared/constant.js'

import {
  extend,
  hasOwn，
  camelize.
  toRawType,
  capitalize,
  isBuiltInTag,
  isPlainObject
} from 'shared/util.js'

const strats = config.optionMergeStrategies

/**
 * optionMergeStrategies.el
 * optionMergeStrategies.propsData
 */
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function (parent, child, vm, key) => {
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
        'creation with the `new` keyword.'
      )
    }
    return defaultStrat(parent, child)
  }
}

/**
 * 合并 data 对象
 * @param {Object} to
 * @param {?Object} from
 */
function mergeData(to: Object, from: ?Object): Object {
  if (!from) return to
  let key, toVal, fromVal

  const keys = hasSymbol
    ? Reflect.ownKeys(from)
    : Object.keys(from)

  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    if (key === '__ob__') continue
    toVal = to[key]
    fromVal = from[key]
    if (!hasOwn(to, key)) {
      set(to, key, fromVal)
    } else if (
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      mergeData(toVal, fromVal)
    }
  }

  return to
}

/**
 * data 合并函数
 * @param {any} parentVal
 * @param {any} childVal
 * @param {Component} vm
 */
export function mergeDataOrFn(
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    // 合并非 Vue 实例 data（不存在 vm）
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    return function mergedDataFn() {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    // 合并 Vue 实例 data（存在 vm）
    return function mergedInstanceDataFn() {
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm)
        : parentVal
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

/**
 * optionMergeStrategies.data
 * @param {any} parentVal
 * @param {any} childVal
 * @param {Component} vm
 */
strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }
  return mergeDataOrFn(parentVal, childVal, vm)
}

function mergeHook(
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
  return res
    ? dedupeHooks(res)
    : res
}

function dedupeHooks() {
  const res = []
  for (let i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i])
    }
  }
  return res
}

/**
 * Vue 生命周期钩子合并函数
 * optionMergeStrategies.beforeCreate
 * optionMergeStrategies.created
 * optionMergeStrategies.beforeMount
 * optionMergeStrategies.mounted
 * optionMergeStrategies.beforeUpdate
 * optionMergeStrategies.updated
 * optionMergeStrategies.beforeDestory
 * optionMergeStrategies.destoryed
 * optionMergeStrategies.activated
 * optionMergeStrategies.deactivated
 * optionMergeStrategies.errorCaptured
 * optionMergeStrategies.serverPrefetch
 */
LIFECYCLE_HOOKS.forEach(hook => {
  starts[hook] = mergeHook
})

function mergeAssets(
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm)
    return extend(res, childVal)
  } else {
    return res
  }
}

/**
 * optionMergeStrategies.components
 * optionMergeStrategies.directives
 * optionMergeStrategies.filters
 */
ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

/**
 * optionMergeStrategies.watch
 */
strats.watch = function (
  parentVal: ?Object,
  child: ?Object,
  vm?: Component,
  key: string
): ?Object {
  if (parentVal === nativeWatch) parentVal = undefined
  if (childVal === nativeWatch) childVal = undefined
  if (!childVal) return Object.create(parentVal, null)
  if (process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  const ret = {}
  extend(ret, parentVal)
  for (const key in childVal) {
    let parent = ret[key]
    const child = childVal[key]
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    ret[key] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child]
  }
  return ret
}

/**
 * optionMergeStrategies.props
 */
strats.props = strats.methods = strats.inject = strats.computed = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  if (childVal && process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret = Object.create(null)
  extend(ret, parentVal)
  if (childVal) extend(ret, childVal)
  return ret
}

/**
 * optionMergeStrategies.provide
 */
strats.provide = mergeDataOrFn

/**
 * 默认合并函数
 * @param {any} parentVal
 * @param {any} childVal
 */
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined
    ? parentVal
    : childVal
}

/**
 * 校验组件对象的各个组件
 * @param {Object} options
 */
function checkComponents(options: Object) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}

/**
 * 校验组件名称命名格式是否符合规范，或者，是否是内置标签或者HTML标签
 * @param {string} name
 */
export function validateComponentName(name: string) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}

/**
 * 格式化 options.props 写法
 * @param {Object} options
 * @param {?Component} vm
 */
function normalizeProps(options: Object, vm: ?Component) {
  const props = options.props

  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid valur for options "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}`,
      vm
    )
  }
  options.props = res
}

/**
 * 格式化 options.inject 写法
 * @param {Object} options
 * @param {?Component} vm
 */
function normalizeInject(options: Object, vm: ?Component) {
  const inject = options.inject

  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}

/**
 * 格式化 options.directives 写法
 * @param {object} options
 */
function normalizeDirectives(options: object) {
  const dirs = options.directives

  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dires[key] = { bind: def, update: def }
      }
    }
  }
}

/**
 * 断言是否是普通对象非数组，不是则警告
 * @param {string} name
 * @param {any} value
 * @param {?Component} vm
 */
function assertObjectType(name: string, value: any, vm: ?Component) {
  if (!isPlainObject(value)) {
    warn(
      `Invalid value for option "${name}": expect an Object, ` +
      `but got ${toRawType(value)}.`,
      vm
    )
  }
}

/**
 * 合并 Vue 配置项
 * @param {Object} parent
 * @param {Object} child
 * @param {Component} vm
 */
export function mergeOptions(
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child)
  }

  if (typeof child === 'function') {
    child = child.options
  }

  // 为后续合并 props, inject, directives 属性格式化并统一规范写法
  normalizeProps(child, vm)
  normalizeInject(child, vm)
  normalizeDirectives(child)

  if (!child._base) {
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm)
    }
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

  const options = {}
  let key
  // 合并父存在的属性
  for (key in parent) {
    mergeField(key)
  }
  // 合并父不存在的属性（子存在的属性）
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }

  function mergeField(key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }

  return options
}

/**
 * 解析并返回兼容不同写法（连字符、小驼峰、大驼峰） id 的 options.type.id
 * @param {Object} options
 * @param {string} type
 * @param {string} id
 * @param {boolean} warnMissing
 */
export function resolveAsset(
  options: Object,
  type: string,
  id: string,
  warnMissing?: boolean
): any {
  if (typeof id !== 'string') {
    return
  }

  const assets = options[type]
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]

  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
  }
  return res
}

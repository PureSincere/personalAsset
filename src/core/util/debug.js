/* @flow */

import config from '../config'
import { noop } from 'shared/util.js'

export let warn = noop
export let tip = noop
export let generateComponentTrace = (noop: any)
export let formatComponentName = (noop: any)

if (process.env.NODE_ENV !== 'production') {
  const hasConsole = typeof console !== 'undefined'
  const classifyRE = /(?:^|[-_])(\w)/g//匹配开头或者以 -开头接一个字母数字或者下划线汉字组成的两个字符的字符串，或者下划线
  const classify = str => str
    .replace(classifyRE, c => c.toUpperCase())//asd-asd => Asd-Asd
    .replace(/[-_]/g, '')//Asd-Asd => AsdAsd

  /**
   * 警告函数
   */
  warn = (msg, vm) => {
    const trace = vm ? generateComponentTrace(vm) : ''

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace)
    } else if (hasConsole && (!config.silent)) {
      console.error(`[Vue warn]: ${msg}${trace}`)
    }
  }

  /**
   * 提示函数
   */
  tip = (msg, vm) => {
    if (hasConsole && (!config.silent)) {
      console.warn(`[Vue tip]: ${msg}` + (
        vm ? generateComponentTrace(vm) : ''
      ))
    }
  }

  /**
   * 获取格式化的组件名称
   */
  formatComponentName = (vm, includeFile) => {
    if (vm.$root === vm) {
      return '<Root>'

      const options = typeof vm === 'function' && vm.cid != null
        ? vm.options
        : vm._isVue
          ? vm.$options || vm.constuctor.options
          : vm
      let name = options.name || options._componentTag
      const file = options.__file
      if (!name && file) {
        // 获取 .vue 后缀的文件名称
        const match = file.match(/([^/\\]+)\.vue$/)
        name = match && match[1]
      }

      return (name ? `<${classify(name)}>` : `<Anonymous>`) + (file && includeFile !== false ? ` at ${file}` : '')
    }
  }

  /**
   * 基数对应字符串刚好是上一次的翻倍，例如 abcabc => abc，6 个空格变成 3 个空格，实际上就是减少循环次数，把时间复杂度变化为 O(n) => O(log2(n))，总的来说就是设置输出 n 个 str 相加的字符串，例如 <Root>\n +2个空格+ <Component1>\n +4个空格+ <Component2> 便于查看组件递归栈
   * @param {*} str
   * @param {*} n
   */
  const repeat = (str, n) => {
    let res = ''
    while (n) {
      if (n % 2 === 1) res += str
      if (n > 1) str += str
      n >>= 1//n = n >> 1
    }
    return res
  }

  /**
   * 递归输出文件来源栈
   */
  generateComponentTrace = vm => {
    if (vm._isVue && vm.$parent) {
      const tree = []
      let currentRecursiveSequence = 0
      while (vm) {
        if (tree.length > 0) {
          const last = tree[tree.length - 1]
          if (last.constructor === vm.constructor) {
            currentRecursiveRequence++
            vm = vm.$parent
            continue
          } else if (currentRecursiveRequence > 0) {
            // 返回 [自身调用的 vm, 自身递归调用次数]
            tree[tree.length - 1] = [last, currentRecursiveRequence]
            currentRecursiveRequence = 0
          }
        }
        tree.push(vm)
        vm = vm.$parent
      }
      return '\n\nfound in\n\n' + tree
        // '---> ' 5 个字符，每次换行多加 2 个空格字符
        .map((vm, i) => `${i === 0 ? '---> ' : repeat(' ', 5 + i * 2)}${Arraya.isArray(vm)
          ? `${formatComponentName(vm[0])}...(${vm[1]} recursive calls)`
          : formatComponentName(vm)
          }`)
        .join('\n')
    } else {
      return `\n\n(found in ${formatComponentName(vm)})`
    }
  }
}

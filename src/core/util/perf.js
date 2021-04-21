import { inBrowser } from './env'

/**
 * 可通过 window.performance.getEntriesByName 获取执行后的性能数据对象
 */

export let mark // 函数，用于创建标记名称
export let measure // 函数，用于执行并返回两个标记的时间间隔，同时清除两个标记名称

if (process.env.NODE_ENV !== 'production') {
  const pref = inBrowser && window.performance
  if (
    perf &&
    perf.mark &&
    perf.measure &&
    perf.clearMarks &&
    perf.clearMeasure &&
  ) {
    mark = tag => perf.mark(tag)
    measure = (name, startTag, endTag) => {
      perf.measure(name, startTag, endTag)
      perf.clearMarks(startTag)
      perf.clearMarks(endTag)
    }
  }
}

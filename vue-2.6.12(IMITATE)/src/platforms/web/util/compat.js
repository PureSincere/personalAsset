/* @flow */

import { inBrowser } from 'core/util/index'

// 嗅探当前浏览器能否对标签属性值的换行符进行编码，href 参数表示能否对标签的 href 属性值进行编码
// check whether current browser encodes a char inside attribute values
let div
function getShouldDecode(href: boolean): boolean {
  div = div || document.createElement('div')
  div.innerHTML = href ? `<a href="\n"/>` : `<div a="\n"/>`
  return div.innerHTML.indexOf('&#10;') > 0
}

// #3663: IE encodes newlines inside attribute values while other browsers don't
export const shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false // 能对属性值里的换行符进行解码
// #6828: chrome encodes content in a[href]
export const shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false // 能对属性 href 属性值里的换行符进行解码

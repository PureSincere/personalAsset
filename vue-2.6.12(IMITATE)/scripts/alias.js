const path = require('path')

const resolve = p => path.resolve(__dirname, '../', p)

module.exports = {
  core: resolve('src/core'),
  vue: resolve('src/platforms/web/entry-runtime-with-compiler'),
  web: resolve('src/platforms/web'),
  shared: resolve('src/shared')
}

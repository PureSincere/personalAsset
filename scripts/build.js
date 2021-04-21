const fs = require('fs');
const rollup = require('rollup')

if (fs.existsSync('dist')) {
  fs.rmdirSync('dist', { recursive: true })
}
fs.mkdirSync('dist')

let builds = require('./config').getAllBuilds()

if (process.argv[2]) {
  const filters = process.argv[2].split(',')
  builds = builds.filter(b => {
    return filters.some(f => b.output.file.indexOf(f) > -1 || b.name.indexOf(f) > -1)
  })
} else {
  builds = builds.filter(b => {
    return b.output.file.indexOf('weex') === -1
  })
}

build(builds)

function build(builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    buildEntry(builds[built])
      .then(() => {
        built++
        if (built < total) {
          next()
        }
      })
      .catch(logError)
  }

  next()
}

function buildEntry(config) {
  const output = config.output
  const { file } = output
  return rollup.rollup(config)
    .then(bundle => bundle.generate(output))
    .then(({ output: [{ code }] }) => {
      return write(file, code)
    })
}

function write(dest, code) {
  return new Promise((resolve, reject) => {
    function report() {
      resolve()
    }

    fs.writeFile(dest, code, err => {
      if (err) reject(err)
      report()
    })
  })
}

function logError(e) {
  console.log(e)
}
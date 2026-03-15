const fs = require('fs')
const path = require('path')

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const schema = read('prisma/schema.prisma')
const configApi = read('app/api/repositories/[id]/config/route.ts')
const processTask = read('lib/translation/process-task.ts')

assert(schema.includes('scopeMode'), 'TranslationConfig should define scopeMode')
assert(schema.includes('selectedFiles'), 'TranslationConfig should define selectedFiles')
assert(configApi.includes('scopeMode'), 'Config API should read and persist scopeMode')
assert(configApi.includes('selectedFiles'), 'Config API should read and persist selectedFiles')
assert(processTask.includes('scopeMode'), 'Translation processor should honor scopeMode')
assert(processTask.includes('selectedFiles'), 'Translation processor should honor selectedFiles')

console.log('Repository config model checks passed.')

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

const configPage = read('app/repositories/[id]/config/config-client-page.tsx')
const fileRoute = read('app/api/repositories/[id]/files/route.ts')
const filePicker = read('components/repository/repository-file-picker.tsx')

assert(configPage.includes("baseLanguage: 'auto'"), 'Repository config page should default baseLanguage to auto')
assert(configPage.includes('scopeMode'), 'Repository config page should manage scopeMode')
assert(configPage.includes('manual_selection'), 'Repository config page should support manual file selection')
assert(configPage.includes('repository-file-picker') || configPage.includes('RepositoryFilePicker'), 'Repository config page should wire a dedicated file picker')
assert(configPage.includes('const isKnownOpenRouterModel'), 'Repository config page should distinguish custom models from the fetched model catalog')
assert(
  configPage.includes("if (!showCustomModelInput && !engine.config.model)"),
  'Repository config page should not reset a custom OpenRouter model selection back to the default model'
)
assert(
  configPage.includes("if (engine.config.model) {") &&
    configPage.includes('setShowCustomModelInput(Boolean(engine.config.model) && !isKnownOpenRouterModel)'),
  'Repository config page should keep the custom model input open until the user enters a model ID'
)
const customModelInputIndex = configPage.indexOf('placeholder="例如：deepseek/deepseek-v3"')
const advancedSettingsIndex = configPage.indexOf('模型高级设置')

assert(
  customModelInputIndex !== -1 && advancedSettingsIndex !== -1 && customModelInputIndex < advancedSettingsIndex,
  'Repository config page should place the custom model input with the model selector instead of inside advanced settings'
)
assert(
  !configPage.includes('setAdvancedOpen(true)'),
  'Repository config page should not force-open advanced settings when choosing a custom model'
)
assert(!configPage.includes('同步策略'), 'Repository config page should no longer show sync strategy in the default surface')
assert(!configPage.includes('目标分支模板'), 'Repository config page should no longer show branch template in the default surface')
assert(!configPage.includes('提交消息模板'), 'Repository config page should no longer show commit template in the default surface')
assert(fileRoute.includes('GET /api/repositories/[id]/files'), 'Repository file route should exist for manual file selection')
assert(filePicker.includes('buildFileTree'), 'Repository file picker should build a file tree instead of rendering a flat grouped list')
assert(filePicker.includes('expandedDirectories'), 'Repository file picker should support expandable tree directories')

console.log('Repository config flow checks passed.')


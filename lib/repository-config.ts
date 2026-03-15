export const SCOPE_MODES = [
  'preset_common_docs',
  'preset_readme_docs',
  'preset_all_markdown',
  'manual_selection',
  'advanced_rules',
] as const

export type ScopeMode = (typeof SCOPE_MODES)[number]

export const DEFAULT_SCOPE_MODE: ScopeMode = 'preset_common_docs'
export const DEFAULT_BASE_LANGUAGE = 'auto'

const PRESET_PATTERNS: Record<Exclude<ScopeMode, 'advanced_rules' | 'manual_selection'>, string[]> = {
  preset_common_docs: ['README*', '**/README*', 'docs/**', '**/*.md', '**/*.mdx'],
  preset_readme_docs: ['README*', '**/README*', 'docs/**'],
  preset_all_markdown: ['**/*.md', '**/*.mdx'],
}

export function normalizeBaseLanguage(baseLanguage: unknown) {
  return typeof baseLanguage === 'string' && baseLanguage.trim().length > 0
    ? baseLanguage.trim()
    : DEFAULT_BASE_LANGUAGE
}

export function sanitizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

export function sanitizeTargetLanguages(baseLanguage: string | undefined, languages: unknown) {
  const normalizedBaseLanguage = normalizeBaseLanguage(baseLanguage)
  return sanitizeStringList(languages).filter((language) => language !== normalizedBaseLanguage)
}

export function sanitizeSelectedFiles(value: unknown) {
  return sanitizeStringList(value).filter((item) => !item.startsWith('/'))
}

function normalizePatterns(value: unknown) {
  return sanitizeStringList(value)
}

function includesReadmePattern(patterns: string[]) {
  return patterns.some((pattern) => pattern.toLowerCase().includes('readme'))
}

function includesDocsPattern(patterns: string[]) {
  return patterns.some((pattern) => pattern.startsWith('docs/') || pattern.includes('docs/**'))
}

function includesMarkdownPatterns(patterns: string[]) {
  return patterns.includes('**/*.md') && patterns.includes('**/*.mdx')
}

export function inferScopeMode(scopeMode: unknown, filePatterns: unknown): ScopeMode {
  if (typeof scopeMode === 'string' && (SCOPE_MODES as readonly string[]).includes(scopeMode)) {
    return scopeMode as ScopeMode
  }

  const patterns = normalizePatterns(filePatterns)

  if (patterns.length === 0) {
    return DEFAULT_SCOPE_MODE
  }

  if (includesReadmePattern(patterns) && includesDocsPattern(patterns) && includesMarkdownPatterns(patterns)) {
    return 'preset_common_docs'
  }

  if (includesReadmePattern(patterns) && includesDocsPattern(patterns) && !includesMarkdownPatterns(patterns)) {
    return 'preset_readme_docs'
  }

  if (!includesDocsPattern(patterns) && patterns.every((pattern) => pattern === '**/*.md' || pattern === '**/*.mdx')) {
    return 'preset_all_markdown'
  }

  return 'advanced_rules'
}

export function resolveFilePatterns(scopeMode: ScopeMode, filePatterns: unknown) {
  if (scopeMode === 'advanced_rules') {
    return normalizePatterns(filePatterns)
  }

  if (scopeMode === 'manual_selection') {
    return []
  }

  return PRESET_PATTERNS[scopeMode]
}

export function resolveExcludePatterns(scopeMode: ScopeMode, excludePatterns: unknown) {
  return scopeMode === 'advanced_rules' ? normalizePatterns(excludePatterns) : []
}

export function toPathRegex(pattern: string) {
  let regexPattern = pattern

  if (pattern.startsWith('**/')) {
    const suffix = pattern.substring(3)
    regexPattern = '(.*/)?' + suffix.replace(/\./g, '\\.').replace(/\?/g, '.').replace(/\*/g, '[^/]*')
  } else if (pattern.includes('**')) {
    const parts = pattern.split('**')
    regexPattern = parts
      .map((part, index) => {
        let value = part
          .replace(/\./g, '\\.')
          .replace(/\?/g, '.')
          .replace(/\*/g, '[^/]*')
          .replace(/\//g, '\\/')

        if (index < parts.length - 1) {
          value += '(.*)'
        }

        return value
      })
      .join('')
  } else {
    regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\?/g, '.')
      .replace(/\*/g, '[^/]*')
      .replace(/\//g, '\\/')
  }

  return new RegExp(`^${regexPattern}$`)
}

export function matchesPattern(path: string, pattern: string) {
  return toPathRegex(pattern).test(path)
}

export function filterPathsByPatterns(paths: string[], includePatterns: string[], excludePatterns: string[] = []) {
  return paths.filter((path) => {
    const matchesInclude = includePatterns.length === 0 || includePatterns.some((pattern) => matchesPattern(path, pattern))
    if (!matchesInclude) {
      return false
    }

    return !excludePatterns.some((pattern) => matchesPattern(path, pattern))
  })
}

export function isLikelyTranslatableDocument(path: string) {
  const normalizedPath = path.toLowerCase()

  return (
    normalizedPath.startsWith('readme') ||
    normalizedPath.includes('/readme') ||
    normalizedPath.startsWith('docs/') ||
    normalizedPath.includes('/docs/') ||
    normalizedPath.endsWith('.md') ||
    normalizedPath.endsWith('.mdx') ||
    normalizedPath.endsWith('.txt')
  )
}

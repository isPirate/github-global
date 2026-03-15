'use client'

import { useMemo, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { GLOBAL_LANGUAGES, POPULAR_LANGUAGE_CODES, type GlobalLanguage } from '@/lib/i18n/languages'

interface LanguageMultiSelectProps {
  selectedCodes: string[]
  excludedCodes?: string[]
  onChange: (codes: string[]) => void
}

function matchesQuery(language: GlobalLanguage, query: string) {
  if (!query) {
    return true
  }

  const normalizedQuery = query.trim().toLowerCase()

  return (
    language.code.toLowerCase().includes(normalizedQuery) ||
    language.name.toLowerCase().includes(normalizedQuery) ||
    language.nativeName.toLowerCase().includes(normalizedQuery) ||
    language.searchTerms.some((term) => term.toLowerCase().includes(normalizedQuery))
  )
}

export default function LanguageMultiSelect({
  selectedCodes,
  excludedCodes = [],
  onChange,
}: LanguageMultiSelectProps) {
  const [query, setQuery] = useState('')

  const availableLanguages = useMemo(
    () => GLOBAL_LANGUAGES.filter((language) => !excludedCodes.includes(language.code)),
    [excludedCodes]
  )

  const selectedLanguages = useMemo(
    () => availableLanguages.filter((language) => selectedCodes.includes(language.code)),
    [availableLanguages, selectedCodes]
  )

  const popularLanguages = useMemo(
    () =>
      availableLanguages.filter(
        (language) =>
          POPULAR_LANGUAGE_CODES.includes(language.code) &&
          !selectedCodes.includes(language.code)
      ),
    [availableLanguages, selectedCodes]
  )

  const filteredLanguages = useMemo(
    () =>
      availableLanguages.filter(
        (language) => matchesQuery(language, query) && !selectedCodes.includes(language.code)
      ),
    [availableLanguages, query, selectedCodes]
  )

  const visibleLanguages = useMemo(
    () => (query ? filteredLanguages : filteredLanguages.slice(0, 18)),
    [filteredLanguages, query]
  )

  const toggleLanguage = (code: string) => {
    onChange(
      selectedCodes.includes(code)
        ? selectedCodes.filter((item) => item !== code)
        : [...selectedCodes, code]
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          已选语言
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {selectedCodes.length}
          </span>
        </div>
        {selectedLanguages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedLanguages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => toggleLanguage(language.code)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/15"
              >
                <span>{language.nativeName}</span>
                <span className="text-primary/70">({language.code})</span>
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">还没有选择目标语言</p>
        )}
      </div>

      {popularLanguages.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">常用语言</div>
          <div className="flex flex-wrap gap-2">
            {popularLanguages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => toggleLanguage(language.code)}
                className="rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-primary/5"
              >
                {language.nativeName}
                <span className="ml-1 text-muted-foreground">({language.code})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-sm font-medium">搜索更多语言</label>
        <p className="text-xs text-muted-foreground">
          先从常用语言里快速选择；如果要覆盖更多全球语言，输入关键词再搜索会更高效。
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入语言名、代码或本地名称"
            className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl border bg-background">
          {visibleLanguages.length > 0 ? (
            visibleLanguages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => toggleLanguage(language.code)}
                className="flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40"
              >
                <div>
                  <div className="text-sm font-medium">{language.nativeName}</div>
                  <div className="text-xs text-muted-foreground">
                    {language.name} · {language.code}
                  </div>
                </div>
                {selectedCodes.includes(language.code) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-muted-foreground">没有找到匹配语言</div>
          )}
        </div>
        {!query && filteredLanguages.length > visibleLanguages.length && (
          <p className="text-xs text-muted-foreground">
            当前只显示前 {visibleLanguages.length} 个候选语言，输入关键词可查看完整全球语言列表。
          </p>
        )}
      </div>
    </div>
  )
}

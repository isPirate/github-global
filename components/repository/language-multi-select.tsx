'use client'

import { useMemo } from 'react'
import { X } from 'lucide-react'
import SearchableSelect, { type SearchableSelectOption } from '@/components/ui/searchable-select'
import { GLOBAL_LANGUAGES, POPULAR_LANGUAGE_CODES } from '@/lib/i18n/languages'

interface LanguageMultiSelectProps {
  selectedCodes: string[]
  excludedCodes?: string[]
  onChange: (codes: string[]) => void
}

export default function LanguageMultiSelect({
  selectedCodes,
  excludedCodes = [],
  onChange,
}: LanguageMultiSelectProps) {
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

  const languageOptions = useMemo<SearchableSelectOption[]>(
    () =>
      availableLanguages
        .filter((language) => !selectedCodes.includes(language.code))
        .map((language) => ({
          value: language.code,
          label: `${language.nativeName} (${language.code})`,
          description: language.name,
          keywords: [language.code, language.name, language.nativeName, ...language.searchTerms],
        })),
    [availableLanguages, selectedCodes]
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

      {popularLanguages.length > 0 ? (
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
      ) : null}

      <div className="space-y-3">
        <label className="text-sm font-medium">搜索更多语言</label>
        <p className="text-xs text-muted-foreground">
          先从常用语言里快速选择；如果要覆盖更多全球语言，打开搜索下拉会更高效。
        </p>
        <SearchableSelect
          multiple
          value={selectedCodes}
          options={languageOptions}
          onChange={(codes) => onChange(codes as string[])}
          placeholder="搜索并添加目标语言"
          emptyText="没有找到匹配语言"
          renderTriggerLabel={() =>
            languageOptions.length > 0 ? '搜索更多语言' : '可选语言已全部加入'
          }
        />
      </div>
    </div>
  )
}

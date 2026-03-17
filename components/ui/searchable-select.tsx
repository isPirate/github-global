'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  keywords?: string[]
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  placeholder: string
  emptyText?: string
  multiple?: boolean
  disabled?: boolean
  triggerClassName?: string
  contentClassName?: string
  renderTriggerLabel?: (selectedOptions: SearchableSelectOption[]) => string
}

const TYPEAHEAD_RESET_MS = 700

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyText = '没有可选项',
  multiple = false,
  disabled = false,
  triggerClassName,
  contentClassName,
  renderTriggerLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [typeahead, setTypeahead] = useState('')
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) {
      return value
    }

    return value ? [value] : []
  }, [value])

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.includes(option.value)),
    [options, selectedValues]
  )

  const selectedIndex = useMemo(() => {
    if (selectedValues.length === 0) {
      return -1
    }

    return options.findIndex((option) => option.value === selectedValues[0])
  }, [options, selectedValues])

  const triggerLabel = useMemo(() => {
    if (renderTriggerLabel) {
      return renderTriggerLabel(selectedOptions)
    }

    if (multiple) {
      if (selectedOptions.length === 0) {
        return placeholder
      }

      if (selectedOptions.length === 1) {
        return selectedOptions[0].label
      }

      return `已选择 ${selectedOptions.length} 项`
    }

    return selectedOptions[0]?.label || placeholder
  }, [multiple, placeholder, renderTriggerLabel, selectedOptions])

  const clearTypeaheadLater = () => {
    if (typeaheadTimerRef.current) {
      clearTimeout(typeaheadTimerRef.current)
    }

    typeaheadTimerRef.current = setTimeout(() => {
      setTypeahead('')
    }, TYPEAHEAD_RESET_MS)
  }

  const scrollToIndex = (index: number) => {
    if (index < 0) {
      return
    }

    const item = itemRefs.current[index]
    item?.scrollIntoView({ block: 'nearest' })
  }

  const findMatchIndex = (query: string) => {
    const normalizedQuery = normalizeText(query)

    if (!normalizedQuery) {
      return -1
    }

    const prefixIndex = options.findIndex((option) => {
      const candidates = [
        option.label,
        option.value,
        option.description || '',
        ...(option.keywords || []),
      ].map(normalizeText)

      return candidates.some((candidate) => candidate.startsWith(normalizedQuery))
    })

    if (prefixIndex !== -1) {
      return prefixIndex
    }

    return options.findIndex((option) => {
      const candidates = [
        option.label,
        option.value,
        option.description || '',
        ...(option.keywords || []),
      ].map(normalizeText)

      return candidates.some((candidate) => candidate.includes(normalizedQuery))
    })
  }

  const handleSelect = (nextValue: string) => {
    if (multiple) {
      const nextValues = selectedValues.includes(nextValue)
        ? selectedValues.filter((item) => item !== nextValue)
        : [...selectedValues, nextValue]

      onChange(nextValues)
      return
    }

    onChange(nextValue)
    setOpen(false)
  }

  const moveActiveIndex = (direction: 1 | -1) => {
    if (options.length === 0) {
      return
    }

    const baseIndex = activeIndex >= 0 ? activeIndex : selectedIndex >= 0 ? selectedIndex : 0
    const nextIndex = (baseIndex + direction + options.length) % options.length
    setActiveIndex(nextIndex)
    scrollToIndex(nextIndex)
  }

  const handleTypeahead = (key: string) => {
    const nextQuery = `${typeahead}${key}`
    setTypeahead(nextQuery)
    clearTypeaheadLater()

    const nextIndex = findMatchIndex(nextQuery)
    if (nextIndex !== -1) {
      setActiveIndex(nextIndex)
      scrollToIndex(nextIndex)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      setOpen(true)
      return
    }

    if (!open) {
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        setOpen(true)
        setTimeout(() => {
          handleTypeahead(event.key)
        }, 0)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveActiveIndex(1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveActiveIndex(-1)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (activeIndex >= 0) {
        handleSelect(options[activeIndex].value)
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      handleTypeahead(event.key)
    }
  }

  useEffect(() => {
    if (!open) {
      setTypeahead('')
      setActiveIndex(-1)
      return
    }

    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0
    setActiveIndex(nextIndex)

    const timer = setTimeout(() => {
      scrollToIndex(nextIndex)
      itemRefs.current[nextIndex]?.focus()
    }, 0)

    return () => clearTimeout(timer)
  }, [open, selectedIndex])

  useEffect(() => {
    return () => {
      if (typeaheadTimerRef.current) {
        clearTimeout(typeaheadTimerRef.current)
      }
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full justify-between rounded-xl px-3 py-2.5 text-sm font-normal',
            !selectedOptions.length && 'text-muted-foreground',
            triggerClassName
          )}
        >
          <span className="truncate text-left">{triggerLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn('w-[var(--radix-popover-trigger-width)] min-w-[18rem] p-1', contentClassName)}
      >
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="max-h-72 overflow-y-auto rounded-md outline-none"
        >
          {options.length > 0 ? (
            options.map((option, index) => {
              const selected = selectedValues.includes(option.value)
              const active = activeIndex === index

              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    itemRefs.current[index] = node
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                    active && 'bg-accent text-accent-foreground',
                    selected && 'bg-primary/10 text-primary',
                    selected && active && 'bg-primary/15'
                  )}
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-medium">{option.label}</div>
                    {option.description ? (
                      <div
                        className={cn(
                          'truncate text-xs text-muted-foreground',
                          selected && 'text-primary/75',
                          active && !selected && 'text-accent-foreground/80'
                        )}
                      >
                        {option.description}
                      </div>
                    ) : null}
                  </div>
                  {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              )
            })
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

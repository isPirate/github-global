'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { GitBranch, GripVertical, Loader2, X } from 'lucide-react'
import SearchableSelect, { type SearchableSelectOption } from '@/components/ui/searchable-select'

interface WatchedBranchSelectProps {
  repositoryId: string
  selectedBranches: string[]
  onChange: (branches: string[]) => void
}

interface BranchesResponse {
  branches: string[]
  defaultBranch: string
}

export default function WatchedBranchSelect({
  repositoryId,
  selectedBranches,
  onChange,
}: WatchedBranchSelectProps) {
  const [branches, setBranches] = useState<string[]>([])
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggingBranch, setDraggingBranch] = useState<string | null>(null)
  const hasAppliedInitialDefaultRef = useRef(false)

  useEffect(() => {
    async function fetchBranches() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/repositories/${repositoryId}/branches`)
        const data: Partial<BranchesResponse> = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data && 'error' in data && typeof data.error === 'string' ? data.error : 'Failed to fetch branches')
        }

        setBranches(Array.isArray(data.branches) ? data.branches : [])
        setDefaultBranch(typeof data.defaultBranch === 'string' ? data.defaultBranch : null)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch branches')
      } finally {
        setLoading(false)
      }
    }

    void fetchBranches()
  }, [repositoryId])

  useEffect(() => {
    if (hasAppliedInitialDefaultRef.current) {
      return
    }

    if (!defaultBranch) {
      return
    }

    if (selectedBranches.length > 0) {
      hasAppliedInitialDefaultRef.current = true
      return
    }

    onChange([defaultBranch])
    hasAppliedInitialDefaultRef.current = true
  }, [defaultBranch, onChange, selectedBranches.length])

  const selectedKnownBranches = useMemo(
    () =>
      selectedBranches.filter((branch) => branches.includes(branch)),
    [branches, selectedBranches]
  )

  const branchOptions = useMemo<SearchableSelectOption[]>(
    () =>
      branches
        .filter((branch) => !selectedBranches.includes(branch))
        .map((branch) => ({
          value: branch,
          label: branch,
          description: branch === defaultBranch ? '默认分支' : '可监听分支',
          keywords: [branch, branch === defaultBranch ? 'default 默认' : ''],
        })),
    [branches, defaultBranch, selectedBranches]
  )

  const toggleBranch = (branch: string) => {
    onChange(
      selectedBranches.includes(branch)
        ? selectedBranches.filter((item) => item !== branch)
        : [...selectedBranches, branch]
    )
  }

  const moveBranch = (draggedBranch: string, targetBranch: string) => {
    if (draggedBranch === targetBranch) {
      return
    }

    const nextBranches = [...selectedBranches]
    const draggedIndex = nextBranches.indexOf(draggedBranch)
    const targetIndex = nextBranches.indexOf(targetBranch)

    if (draggedIndex === -1 || targetIndex === -1) {
      return
    }

    nextBranches.splice(draggedIndex, 1)
    nextBranches.splice(targetIndex, 0, draggedBranch)
    onChange(nextBranches)
  }

  return (
    <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <GitBranch className="h-4 w-4" />
          监听分支
        </div>
        <p className="text-xs text-muted-foreground">
          从仓库现有分支中选择需要监听的分支。留空时会自动回退到默认分支
          {defaultBranch ? ` ${defaultBranch}` : ''}。
        </p>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          已选分支
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {selectedBranches.length}
          </span>
        </div>
        {selectedKnownBranches.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedKnownBranches.map((branch) => (
              <div
                key={branch}
                draggable
                onDragStart={() => setDraggingBranch(branch)}
                onDragEnd={() => setDraggingBranch(null)}
                onDragOver={(event) => {
                  event.preventDefault()
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  if (draggingBranch) {
                    moveBranch(draggingBranch, branch)
                  }
                  setDraggingBranch(null)
                }}
                className={`inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/15 ${
                  draggingBranch === branch ? 'opacity-60' : ''
                }`}
              >
                <span className="cursor-grab text-primary/70 active:cursor-grabbing" aria-hidden="true">
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <span>{branch}</span>
                {branch === defaultBranch ? <span className="text-primary/70">(默认)</span> : null}
                <button
                  type="button"
                  onClick={() => toggleBranch(branch)}
                  className="inline-flex items-center"
                  aria-label={`移除分支 ${branch}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            还没有选择监听分支，留空时将使用默认分支
            {defaultBranch ? ` ${defaultBranch}` : ''}。
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在加载仓库分支...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          <SearchableSelect
            multiple
            value={selectedBranches}
            options={branchOptions}
            onChange={(value) => onChange(value as string[])}
            placeholder="搜索并添加监听分支"
            emptyText="没有更多可选分支"
            renderTriggerLabel={() =>
              branchOptions.length > 0 ? '搜索并添加监听分支' : '可选分支已全部加入'
            }
          />
          {defaultBranch ? (
            <p className="text-xs text-muted-foreground">
              自动触发会监听所有已选分支；手动翻译和候选文件列表仅使用第一个已选分支。可以拖拽已选分支调整主分支顺序；留空时会使用默认分支。
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

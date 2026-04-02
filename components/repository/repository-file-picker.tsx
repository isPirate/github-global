'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, FileText, Folder, FolderOpen, Loader2, RefreshCw, Search } from 'lucide-react'

interface RepositoryFile {
  path: string
  directory: string
  extension: string
  isDocumentationCandidate: boolean
}

interface RepositoryFilesResponse {
  files: RepositoryFile[]
  totalCount: number
  defaultBranch: string
  sourceBranch: string
}

interface FileTreeNode {
  name: string
  path: string
  isFile: boolean
  file?: RepositoryFile
  children: FileTreeNode[]
}

interface RepositoryFilePickerProps {
  repositoryId: string
  selectedFiles: string[]
  onChange: (files: string[]) => void
  enabled: boolean
}

function toggleItem(selectedFiles: string[], path: string) {
  return selectedFiles.includes(path)
    ? selectedFiles.filter((item) => item !== path)
    : [...selectedFiles, path]
}

function buildFileTree(files: RepositoryFile[]) {
  const root: FileTreeNode[] = []

  files.forEach((file) => {
    const segments = file.path.split('/').filter(Boolean)
    let currentLevel = root
    let currentPath = ''

    segments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment
      const isFile = index === segments.length - 1
      let node = currentLevel.find((item) => item.name === segment && item.isFile === isFile)

      if (!node) {
        node = {
          name: segment,
          path: currentPath,
          isFile,
          file: isFile ? file : undefined,
          children: [],
        }
        currentLevel.push(node)
      }

      if (!isFile) {
        currentLevel = node.children
      }
    })
  })

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((left, right) => {
      if (left.isFile !== right.isFile) {
        return left.isFile ? 1 : -1
      }

      return left.name.localeCompare(right.name)
    })

    nodes.forEach((node) => sortNodes(node.children))
  }

  sortNodes(root)
  return root
}

export default function RepositoryFilePicker({
  repositoryId,
  selectedFiles,
  onChange,
  enabled,
}: RepositoryFilePickerProps) {
  const [files, setFiles] = useState<RepositoryFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sourceBranch, setSourceBranch] = useState<string | null>(null)
  const [expandedDirectories, setExpandedDirectories] = useState<Set<string>>(new Set(['']))

  useEffect(() => {
    if (!enabled || files.length > 0 || loading) {
      return
    }

    async function fetchFiles() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/repositories/${repositoryId}/files`)
        const data: Partial<RepositoryFilesResponse> = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Failed to fetch repository files')
        }

        setFiles(Array.isArray(data.files) ? data.files : [])
        setSourceBranch(typeof data.sourceBranch === 'string' ? data.sourceBranch : null)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch repository files')
      } finally {
        setLoading(false)
      }
    }

    void fetchFiles()
  }, [enabled, files.length, loading, repositoryId])

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return files.filter((file) => {
      if (!normalizedQuery) {
        return true
      }

      return (
        file.path.toLowerCase().includes(normalizedQuery) ||
        file.directory.toLowerCase().includes(normalizedQuery) ||
        file.extension.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [files, query])

  const fileTree = useMemo(() => buildFileTree(filteredFiles), [filteredFiles])

  const refreshFiles = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/repositories/${repositoryId}/files`)
      const data: Partial<RepositoryFilesResponse> = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch repository files')
      }

      setFiles(Array.isArray(data.files) ? data.files : [])
      setSourceBranch(typeof data.sourceBranch === 'string' ? data.sourceBranch : null)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch repository files')
    } finally {
      setLoading(false)
    }
  }

  const selectVisible = () => {
    onChange(Array.from(new Set([...selectedFiles, ...filteredFiles.map((file) => file.path)])))
  }

  const clearVisible = () => {
    const visibleSet = new Set(filteredFiles.map((file) => file.path))
    onChange(selectedFiles.filter((file) => !visibleSet.has(file)))
  }

  const toggleDirectory = (path: string) => {
    setExpandedDirectories((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const renderNodes = (nodes: FileTreeNode[], depth = 0) => {
    return nodes.flatMap((node) => {
      if (node.isFile && node.file) {
        const checked = selectedFiles.includes(node.file.path)
        return [
          <label
            key={node.file.path}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition-colors ${
              checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
            }`}
            style={{ marginLeft: depth * 16 }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onChange(toggleItem(selectedFiles, node.file!.path))}
              className="mt-1 h-4 w-4 rounded border-muted-foreground text-primary focus:ring-primary"
            />
            <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{node.name}</div>
              <div className="text-xs text-muted-foreground">{node.file.path}</div>
            </div>
          </label>,
        ]
      }

      const isExpanded = query ? true : expandedDirectories.has(node.path)
      return [
        <div key={node.path} className="space-y-2">
          <button
            type="button"
            onClick={() => toggleDirectory(node.path)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors hover:bg-muted/40"
            style={{ marginLeft: depth * 16 }}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            {isExpanded ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-muted-foreground" />}
            <span>{node.name}</span>
            <span className="text-xs text-muted-foreground">({node.children.length})</span>
          </button>
          {isExpanded ? renderNodes(node.children, depth + 1) : []}
        </div>,
      ]
    })
  }

  if (!enabled) {
    return null
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">手动选择翻译文件</div>
          <div className="text-sm text-muted-foreground">
            当前已选择 {selectedFiles.length} 个文件
            {sourceBranch ? `，文件列表来自 ${sourceBranch} 分支` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectVisible}
            disabled={filteredFiles.length === 0}
            className="rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            选中当前结果
          </button>
          <button
            type="button"
            onClick={clearVisible}
            disabled={filteredFiles.length === 0}
            className="rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            清空当前结果
          </button>
          <button
            type="button"
            onClick={refreshFiles}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索文件路径、目录或后缀"
          className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在加载仓库文件列表...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
          没有找到符合条件的文档文件
        </div>
      ) : (
        <div className="max-h-[28rem] space-y-2 overflow-y-auto rounded-xl border bg-background p-4">
          {renderNodes(fileTree)}
        </div>
      )}
    </div>
  )
}


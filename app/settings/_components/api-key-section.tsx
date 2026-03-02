'use client'

import { useState } from 'react'

interface ApiKeySectionProps {
  hasKey: boolean
  onSave: (apiKey: string) => void
  onDelete: () => void
  saving: boolean
}

export default function ApiKeySection({
  hasKey,
  onSave,
  onDelete,
  saving,
}: ApiKeySectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = () => {
    if (!apiKey.trim()) return
    onSave(apiKey.trim())
    setApiKey('')
    setShowForm(false)
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    onDelete()
    setConfirmDelete(false)
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold mb-4">OpenRouter API 密钥</h2>
      <p className="text-sm text-muted-foreground mb-6">
        设置全局 API 密钥，用于所有仓库的翻译。您也可以在单个仓库中配置专属密钥
      </p>

      <div className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center gap-3 p-4 rounded-md bg-muted">
          <div
            className={`w-3 h-3 rounded-full ${hasKey ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          <span className="text-sm">
            {hasKey ? '已配置 API 密钥' : '未配置 API 密钥'}
          </span>
        </div>

        {/* Show Form or Buttons */}
        {!showForm ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {hasKey ? '更新密钥' : '配置密钥'}
            </button>
            {hasKey && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className={`px-4 py-2 rounded-md transition-colors ${
                  confirmDelete
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border border-red-500 text-red-600 hover:bg-red-50'
                }`}
              >
                {confirmDelete ? '确认删除' : '删除密钥'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4 border rounded-md">
            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="w-full px-3 py-2 pr-20 border rounded-md"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-primary"
                >
                  {showKey ? '隐藏' : '显示'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                在{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenRouter
                </a>{' '}
                获取 API 密钥
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !apiKey.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setApiKey('')
                  setConfirmDelete(false)
                }}
                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="rounded-md bg-blue-500/10 border border-blue-500/30 p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <strong>提示：</strong>密钥使用 AES-256-GCM 加密存储，仅在翻译时解密使用。
          </p>
        </div>
      </div>
    </div>
  )
}

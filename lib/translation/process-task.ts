import { prisma } from '@/lib/db/prisma'
import { OpenRouterEngine, type TranslationConfig } from '@/lib/translation/openrouter'
import { getEncryptionService } from '@/lib/crypto/encryption'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from 'octokit'
import { createHash } from 'crypto'
import {
  filterPathsByPatterns,
  inferScopeMode,
  normalizeBaseLanguage,
  normalizeBranchName,
  resolvePreferredBranch,
  resolveExcludePatterns,
  resolveFilePatterns,
  sanitizeSelectedFiles,
  sanitizeTargetLanguages,
} from '@/lib/repository-config'

function looksLikePlaintextOpenRouterKey(value: string | null | undefined) {
  return typeof value === 'string' && value.startsWith('sk-or-')
}

function looksLikeEncryptedValue(value: string | null | undefined) {
  return typeof value === 'string' && /^[0-9a-f]+$/i.test(value) && value.length > 64
}

function resolveOpenRouterApiKey(repository: {
  engines: Array<{ encryptedApiKey: string }>
  user?: { settings?: { encryptedOpenRouterKey: string | null } | null } | null
}) {
  const repoKey = repository.engines[0]?.encryptedApiKey
  const userKey = repository.user?.settings?.encryptedOpenRouterKey

  if (looksLikePlaintextOpenRouterKey(repoKey)) {
    return repoKey
  }

  if (looksLikeEncryptedValue(repoKey)) {
    const encryptionService = getEncryptionService()
    const decryptedRepoKey = encryptionService.decrypt(repoKey)
    if (looksLikePlaintextOpenRouterKey(decryptedRepoKey)) {
      return decryptedRepoKey
    }
  }

  if (userKey) {
    const encryptionService = getEncryptionService()
    const decryptedUserKey = encryptionService.decrypt(userKey)
    if (looksLikePlaintextOpenRouterKey(decryptedUserKey)) {
      return decryptedUserKey
    }
  }

  throw new Error('No valid OpenRouter API key found. Update the repository API key or configure a global OpenRouter API key in Settings.')
}

function resolveTranslationConfig(config: unknown): TranslationConfig {
  if (!config || typeof config !== 'object' || !('model' in config)) {
    return {
      model: 'openai/gpt-4-turbo',
      temperature: 0.3,
    }
  }

  const candidate = config as Record<string, unknown>
  const rawModel =
    typeof candidate.model === 'string' && candidate.model.length > 0
      ? candidate.model
      : 'openai/gpt-4-turbo'
  const normalizedModel =
    rawModel === 'deepseek/deepseek-v3' ? 'deepseek/deepseek-chat' : rawModel

  return {
    model: normalizedModel,
    fallbackModels: Array.isArray(candidate.fallbackModels)
      ? candidate.fallbackModels.filter(
          (item): item is string => typeof item === 'string'
        )
      : undefined,
    temperature:
      typeof candidate.temperature === 'number'
        ? candidate.temperature
        : 0.3,
    maxTokens:
      typeof candidate.maxTokens === 'number' ? candidate.maxTokens : undefined,
  }
}

function buildTranslationBranchName(sourceBranch: string) {
  const now = new Date()
  const pad = (value: number) => value.toString().padStart(2, '0')
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const normalizedSourceBranch = sourceBranch
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `i18n/${datePart}/${normalizedSourceBranch || 'default'}-${timePart}`
}

export async function processTranslationTask(taskId: string, repository: any) {
  try {
    const [task, fullRepository] = await Promise.all([
      prisma.translationTask.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          sourceBranch: true,
          triggerType: true,
        },
      }),
      prisma.repository.findUnique({
        where: { id: repository.id },
        include: {
          config: true,
          engines: {
            where: { isActive: true },
          },
          installation: true,
          user: {
            include: {
              settings: true,
            },
          },
        },
      }),
    ])

    if (!task) {
      throw new Error('Translation task not found')
    }

    if (!fullRepository) {
      throw new Error('Repository not found')
    }

    if (!fullRepository.installation) {
      throw new Error('Installation not found for this repository')
    }

    if (!fullRepository.config) {
      throw new Error('Translation configuration not found')
    }

    await prisma.translationTask.update({
      where: { id: taskId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    })

    await prisma.translationHistory.create({
      data: {
        taskId,
        repositoryId: fullRepository.id,
        eventType: 'started',
        eventData: {
          sourceBranch: task.sourceBranch,
          timestamp: new Date().toISOString(),
        },
      },
    })

    const appId = process.env.GITHUB_APP_ID
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY

    if (!appId || !privateKey) {
      throw new Error('GitHub App credentials not configured')
    }

    const auth = createAppAuth({
      appId: parseInt(appId),
      privateKey: privateKey,
    })

    const installationAuthentication = await auth({
      type: 'installation',
      installationId: parseInt(fullRepository.installation.installationId.toString()),
    })

    const octokit = new Octokit({
      auth: installationAuthentication.token,
    })

    const [owner, repo] = fullRepository.fullName.split('/')
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    })
    const defaultBranch = repoData.default_branch || 'main'
    const sourceBranch =
      normalizeBranchName(task.sourceBranch) ||
      resolvePreferredBranch(defaultBranch, fullRepository.config.watchedBranches)

    const baseLanguage = normalizeBaseLanguage(fullRepository.config.baseLanguage)
    const targetLanguages = sanitizeTargetLanguages(baseLanguage, fullRepository.config.targetLanguages)
    const scopeMode = inferScopeMode(fullRepository.config.scopeMode, fullRepository.config.filePatterns)
    const selectedFiles = sanitizeSelectedFiles(fullRepository.config.selectedFiles)
    const filePatterns = resolveFilePatterns(scopeMode, fullRepository.config.filePatterns)
    const excludePatterns = resolveExcludePatterns(scopeMode, fullRepository.config.excludePatterns)

    if (targetLanguages.length === 0) {
      throw new Error('No valid target languages remain after excluding the base language')
    }

    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${sourceBranch}`,
    })

    const currentSha = refData.object.sha
    const treeSha = currentSha
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
      recursive: 'true',
    })

    const repositoryFiles = treeData.tree.filter(
      (item: any): item is { type: 'blob'; path: string } =>
        item.type === 'blob' && typeof item.path === 'string'
    )

    const filesToTranslate =
      scopeMode === 'manual_selection'
        ? repositoryFiles.filter((item) => selectedFiles.includes(item.path))
        : repositoryFiles.filter((item) => filterPathsByPatterns([item.path], filePatterns, excludePatterns).length > 0)

    if (filesToTranslate.length === 0) {
      throw new Error('No files matched the current translation scope')
    }

    await prisma.translationTask.update({
      where: { id: taskId },
      data: {
        totalFiles: filesToTranslate.length * targetLanguages.length,
      },
    })

    const engineConfig = fullRepository.engines[0]
    const resolvedApiKey = resolveOpenRouterApiKey(fullRepository)
    const engine = new OpenRouterEngine(
      resolvedApiKey,
      resolveTranslationConfig(engineConfig.config)
    )

    let processedFiles = 0
    let failedFiles = 0
    let totalTokens = 0

    const branchName = buildTranslationBranchName(sourceBranch)

    try {
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: currentSha,
      })
    } catch (error) {
      console.error('[Translate] Failed to create branch:', error)
      throw new Error('Failed to create translation branch')
    }

    const filesToCommit = new Map<string, Array<{
      path: string
      content: string
      fileRecordId: string
      tokensUsed: number
    }>>()

    for (const file of filesToTranslate) {
      for (const lang of targetLanguages) {
        let fileRecord: any = null

        try {
          fileRecord = await prisma.translationFile.create({
            data: {
              taskId,
              repositoryId: fullRepository.id,
              filePath: file.path,
              targetLanguage: lang,
              status: 'processing',
              startedAt: new Date(),
            },
          })

          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: file.path,
            ref: sourceBranch,
          })

          if ('content' in fileData && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
            const contentHash = createHash('sha256').update(content).digest('hex')

            await prisma.translationFile.update({
              where: { id: fileRecord.id },
              data: {
                sourceContentHash: contentHash,
              },
            })

            const result = await engine.translate(
              content,
              baseLanguage,
              lang,
              {
                fileName: file.path,
                projectName: fullRepository.name,
              }
            )

            totalTokens += result.usage.totalTokens

            const translatedFilePath = `i18n/${lang}/${file.path}`
            const translatedContentHash = createHash('sha256')
              .update(result.text)
              .digest('hex')

            if (!filesToCommit.has(lang)) {
              filesToCommit.set(lang, [])
            }

            filesToCommit.get(lang)!.push({
              path: translatedFilePath,
              content: result.text,
              fileRecordId: fileRecord.id,
              tokensUsed: result.usage.totalTokens,
            })

            await prisma.translationFile.update({
              where: { id: fileRecord.id },
              data: {
                translatedContentHash,
                tokensUsed: result.usage.totalTokens,
                status: 'completed',
                completedAt: new Date(),
              },
            })

            processedFiles++
            await prisma.translationTask.update({
              where: { id: taskId },
              data: {
                processedFiles,
                totalTokens,
              },
            })
          }
        } catch (error) {
          console.error(`Error processing file ${file.path} for language ${lang}:`, error)
          failedFiles++

          if (fileRecord) {
            await prisma.translationFile
              .update({
                where: { id: fileRecord.id },
                data: {
                  status: 'failed',
                  errorMessage: `Processing failed: ${error instanceof Error ? error.message : String(error)}`,
                  completedAt: new Date(),
                },
              })
              .catch((updateError) => {
                console.error('Failed to update file record:', updateError)
              })
          }

          failedFiles++
          await prisma.translationTask
            .update({
              where: { id: taskId },
              data: {
                failedFiles,
              },
            })
            .catch((updateError) => {
              console.error('Failed to update task failedFiles count:', updateError)
            })
        }
      }
    }

    let latestCommitSha = currentSha

    for (const [lang, files] of filesToCommit.entries()) {
      try {
        const treeItems = await Promise.all(
          files.map(async (file) => {
            const { data: blob } = await octokit.rest.git.createBlob({
              owner,
              repo,
              content: Buffer.from(file.content).toString('base64'),
              encoding: 'base64',
            })

            return {
              path: file.path,
              mode: '100644' as const,
              type: 'blob' as const,
              sha: blob.sha,
            }
          })
        )

        const { data: tree } = await octokit.rest.git.createTree({
          owner,
          repo,
          base_tree: latestCommitSha,
          tree: treeItems,
        })

        const { data: commit } = await octokit.rest.git.createCommit({
          owner,
          repo,
          message: `docs: translate to ${lang.toUpperCase()} (${files.length} files)`,
          tree: tree.sha,
          parents: [latestCommitSha],
        })

        await octokit.rest.git.updateRef({
          owner,
          repo,
          ref: `heads/${branchName}`,
          sha: commit.sha,
        })

        latestCommitSha = commit.sha
      } catch (error) {
        console.error(`[Translate] Error committing files for ${lang}:`, error)

        await Promise.all(
          files.map((file) =>
            prisma.translationFile.update({
              where: { id: file.fileRecordId },
              data: {
                status: 'failed',
                errorMessage: `Commit failed: ${error instanceof Error ? error.message : String(error)}`,
              },
            })
          )
        )

        const commitFailedFiles = files.length
        processedFiles -= commitFailedFiles
        failedFiles += commitFailedFiles

        await prisma.translationTask.update({
          where: { id: taskId },
          data: {
            processedFiles,
            failedFiles,
          },
        })
      }
    }

    let prNumber: number | null = null
    let prUrl: string | null = null

    try {
      const sourceLang = baseLanguage
      const targetLangs = Array.from(filesToCommit.keys())
        .map((lang) => lang.toUpperCase())
        .join(', ')
      const prTitle = `docs: I18n Translation ${sourceLang.toUpperCase()} → ${targetLangs} (${new Date().toLocaleDateString('zh-CN')})`

      const languageList = Array.from(filesToCommit.entries())
        .map(([lang, files]) => `- **${lang.toUpperCase()}**: ${files.length} files`)
        .join('\n')

      const fileTreePreview = Array.from(filesToCommit.keys())
        .map((lang) => `|- ${lang}/`)
        .join('\n')

      const sampleFiles = Array.from(filesToCommit.entries())
        .flatMap(([lang, files]) =>
          files.slice(0, 3).map((file) => `i18n/${lang}/${file.path}`)
        )
        .slice(0, 10)
        .map((file) => `- ${file}`)
        .join('\n')

      const prBody = `## Internationalization Translation

This pull request contains automated translations for multiple languages.

### Statistics
- **Languages**: ${filesToCommit.size}
- **Total Files**: ${processedFiles}
- **Failed Files**: ${failedFiles}
- **Tokens Used**: ${totalTokens.toLocaleString()}

### Language Breakdown
${languageList}

### File Structure
Translations are organized under \`i18n/{lang}/\` directory:

\`\`\`
i18n/
${fileTreePreview}
|- ...
\`\`\`

### Sample Files
${sampleFiles}
${filesToCommit.size > 0 && Array.from(filesToCommit.values()).flat().length > 10 ? '...\n*(Showing first 10 files)*' : ''}

---

Generated by [GitHub Global](https://github.com/apps/i18n-github-global) - Automated Translation Tool

**Note**: Please review the translations before merging.`

      const { data: pr } = await octokit.rest.pulls.create({
        owner,
        repo,
        title: prTitle,
        body: prBody,
        head: branchName,
        base: sourceBranch,
        maintainer_can_modify: true,
      })

      prNumber = pr.number
      prUrl = pr.html_url

      await prisma.translationFile.updateMany({
        where: { taskId },
        data: { prNumber: pr.number },
      })
    } catch (error) {
      console.error('[Translate] Failed to create PR:', error)

      await prisma.translationHistory.create({
        data: {
          taskId,
          repositoryId: fullRepository.id,
          eventType: 'pr_failed',
          eventData: {
            error: error instanceof Error ? error.message : String(error),
          },
        },
      })
    }

    const finalStatus = processedFiles === 0 ? 'failed' : 'completed'

    await prisma.translationTask.update({
      where: { id: taskId },
      data: {
        status: finalStatus,
        processedFiles,
        failedFiles,
        totalTokens,
        completedAt: new Date(),
      },
    })

    await prisma.translationHistory.create({
      data: {
        taskId,
        repositoryId: fullRepository.id,
        eventType: failedFiles > 0 ? 'completed' : 'completed',
        eventData: {
          processedFiles,
          failedFiles,
          totalTokens,
          prNumber,
          prUrl,
          branch: branchName,
          sourceBranch,
          defaultBranch,
          languages: Array.from(filesToCommit.keys()),
          timestamp: new Date().toISOString(),
        },
      },
    })
  } catch (error) {
    console.error(`Error processing translation task ${taskId}:`, error)

    await prisma.translationTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        errorMessage: String(error),
        completedAt: new Date(),
      },
    })
  }
}


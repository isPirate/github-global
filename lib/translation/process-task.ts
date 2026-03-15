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

  return {
    model:
      typeof candidate.model === 'string' && candidate.model.length > 0
        ? candidate.model
        : 'openai/gpt-4-turbo',
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

export async function processTranslationTask(taskId: string, repository: any) {
  try {
    const fullRepository = await prisma.repository.findUnique({
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
    })

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
        eventData: { timestamp: new Date().toISOString() },
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
      owner: fullRepository.fullName.split('/')[0],
      repo: fullRepository.fullName.split('/')[1],
      ref: 'heads/main',
    })

    const currentSha = refData.object.sha
    const treeSha = currentSha
    const { data: treeData } = await octokit.rest.git.getTree({
      owner: fullRepository.fullName.split('/')[0],
      repo: fullRepository.fullName.split('/')[1],
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

    const timestamp = Math.floor(Date.now() / 1000)
    const branchName = `i18n/update-${timestamp}`

    try {
      await octokit.rest.git.createRef({
        owner: fullRepository.fullName.split('/')[0],
        repo: fullRepository.fullName.split('/')[1],
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
            owner: fullRepository.fullName.split('/')[0],
            repo: fullRepository.fullName.split('/')[1],
            path: file.path,
            ref: 'heads/main',
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
              owner: fullRepository.fullName.split('/')[0],
              repo: fullRepository.fullName.split('/')[1],
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
          owner: fullRepository.fullName.split('/')[0],
          repo: fullRepository.fullName.split('/')[1],
          base_tree: latestCommitSha,
          tree: treeItems,
        })

        const { data: commit } = await octokit.rest.git.createCommit({
          owner: fullRepository.fullName.split('/')[0],
          repo: fullRepository.fullName.split('/')[1],
          message: `docs: translate to ${lang.toUpperCase()} (${files.length} files)`,
          tree: tree.sha,
          parents: [latestCommitSha],
        })

        await octokit.rest.git.updateRef({
          owner: fullRepository.fullName.split('/')[0],
          repo: fullRepository.fullName.split('/')[1],
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
        owner: fullRepository.fullName.split('/')[0],
        repo: fullRepository.fullName.split('/')[1],
        title: prTitle,
        body: prBody,
        head: branchName,
        base: 'main',
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


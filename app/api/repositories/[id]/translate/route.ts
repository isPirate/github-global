import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { translationQueue } from '@/lib/translation/queue'
import { OpenRouterEngine } from '@/lib/translation/openrouter'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from 'octokit'
import { createHash } from 'crypto'

// POST /api/repositories/[id]/translate - Manually trigger translation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repositoryId = params.id

    // Get repository with configuration
    const repository = await prisma.repository.findFirst({
      where: {
        id: repositoryId,
        userId: session.user.id,
      },
      include: {
        config: true,
        engines: {
          where: { isActive: true },
        },
        installation: true,
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (!repository.config) {
      return NextResponse.json(
        { error: 'Please configure translation settings first' },
        { status: 400 }
      )
    }

    if (!repository.isActive) {
      return NextResponse.json(
        { error: 'Repository is not active. Please enable it first.' },
        { status: 400 }
      )
    }

    if (repository.engines.length === 0) {
      return NextResponse.json(
        { error: 'No active translation engine found. Please configure an engine.' },
        { status: 400 }
      )
    }

    // Create a translation task
    const task = await prisma.translationTask.create({
      data: {
        repositoryId: repository.id,
        triggerType: 'manual',
        status: 'pending',
        totalFiles: 0,
        processedFiles: 0,
        failedFiles: 0,
      },
    })

    // Add to translation queue
    translationQueue.add(
      async () => {
        await processTranslationTask(task.id, repository)
      },
      { taskId: task.id }
    )

    return NextResponse.json({
      success: true,
      taskId: task.id,
      message: 'Translation task created successfully',
    })
  } catch (error) {
    console.error('[API] Error triggering translation:', error)
    return NextResponse.json(
      { error: 'Failed to trigger translation', message: String(error) },
      { status: 500 }
    )
  }
}

export async function processTranslationTask(taskId: string, repository: any) {
  try {
    // Re-query repository with all necessary relations
    // This ensures we have all required data even when called from retry API
    const fullRepository = await prisma.repository.findUnique({
      where: { id: repository.id },
      include: {
        config: true,
        engines: {
          where: { isActive: true },
        },
        installation: true,
      },
    })

    if (!fullRepository) {
      throw new Error('Repository not found')
    }

    if (!fullRepository.installation) {
      throw new Error('Installation not found for this repository')
    }

    // Update task status to processing
    await prisma.translationTask.update({
      where: { id: taskId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    })

    // Create history entry
    await prisma.translationHistory.create({
      data: {
        taskId,
        repositoryId: fullRepository.id,
        eventType: 'started',
        eventData: { timestamp: new Date().toISOString() },
      },
    })

    // Get GitHub access token
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

    // Get repository files based on file patterns
    const targetLanguages = fullRepository.config.targetLanguages as string[]
    const filePatterns = fullRepository.config.filePatterns as string[]

    // For now, we'll get all markdown files from the default branch
    // In production, you'd want to use the glob patterns to filter files
    const { data: refData } = await octokit.rest.git.getRef({
      owner: fullRepository.fullName.split('/')[0],
      repo: fullRepository.fullName.split('/')[1],
      ref: 'heads/main',
    })

    // Get current commit SHA for branch creation
    const currentSha = refData.object.sha
    const treeSha = currentSha
    const { data: treeData } = await octokit.rest.git.getTree({
      owner: fullRepository.fullName.split('/')[0],
      repo: fullRepository.fullName.split('/')[1],
      tree_sha: treeSha,
      recursive: 'true',
    })

    // Filter files based on patterns
    const filesToTranslate = treeData.tree.filter((item: any) => {
      if (item.type !== 'blob') return false
      return filePatterns.some((pattern) => {
        // Improved glob matching
        let regexPattern = pattern

        // Handle ** patterns
        if (pattern.startsWith('**/')) {
          // **/*.md -> matches any file ending with .md at any depth
          const suffix = pattern.substring(3) // Remove **/
          regexPattern = '(.*/)?' + suffix.replace(/\./g, '\\.').replace(/\?/g, '.').replace(/\*/g, '[^/]*')
        } else if (pattern.includes('**')) {
          // path/**/suffix -> matches path/suffix with any directories in between
          const parts = pattern.split('**')
          regexPattern = parts.map((part: string, i: number) => {
            let p = part.replace(/\./g, '\\.').replace(/\?/g, '.').replace(/\*/g, '[^/]*').replace(/\//g, '\\/')
            if (i < parts.length - 1) p += '(.*)'
            return p
          }).join('')
        } else {
          // Normal glob: *.md, docs/*.md, etc.
          regexPattern = pattern.replace(/\./g, '\\.').replace(/\?/g, '.').replace(/\*/g, '[^/]*').replace(/\//g, '\\/')
        }

        const regex = new RegExp('^' + regexPattern + '$')
        const matches = regex.test(item.path)

        // Debug logging
        if (item.path.endsWith('.md') || item.path.endsWith('.mdx')) {
          console.log(`[Glob] ${item.path} vs ${pattern}: ${matches ? 'MATCH' : 'NO MATCH'} (regex: ^${regexPattern}$)`)
        }

        return matches
      })
    })

    console.log(`[Translate] Found ${filesToTranslate.length} files to translate out of ${treeData.tree.length} total items`)

    // Update task with total file count
    await prisma.translationTask.update({
      where: { id: taskId },
      data: {
        totalFiles: filesToTranslate.length * targetLanguages.length,
      },
    })

    // Get translation engine
    const engineConfig = fullRepository.engines[0]
    const engine = new OpenRouterEngine(engineConfig.encryptedApiKey, engineConfig.config)

    let processedFiles = 0
    let failedFiles = 0
    let totalTokens = 0

    // Generate unique branch name based on timestamp
    const timestamp = Math.floor(Date.now() / 1000)
    const branchName = `i18n/update-${timestamp}`
    console.log(`[Translate] Using branch: ${branchName}`)

    // Create unified branch for all languages
    try {
      await octokit.rest.git.createRef({
        owner: fullRepository.fullName.split('/')[0],
        repo: fullRepository.fullName.split('/')[1],
        ref: `refs/heads/${branchName}`,
        sha: currentSha,
      })
      console.log(`[Translate] Created branch: ${branchName}`)
    } catch (error) {
      console.error('[Translate] Failed to create branch:', error)
      throw new Error('Failed to create translation branch')
    }

    // Collect files to commit by language
    const filesToCommit = new Map<string, Array<{
      path: string
      content: string
      fileRecordId: string
      tokensUsed: number
    }>>()

    // Process each file for each target language
    for (const file of filesToTranslate) {
      for (const lang of targetLanguages) {
        let fileRecord: any = null

        try {
          // Create file translation record BEFORE processing
          // This ensures we have a record even if processing fails
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

          // Get file content
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner: fullRepository.fullName.split('/')[0],
            repo: fullRepository.fullName.split('/')[1],
            path: file.path,
            ref: 'heads/main',
          })

          if ('content' in fileData && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8')

            // Update source content hash using SHA256
            const contentHash = createHash('sha256').update(content).digest('hex')
            await prisma.translationFile.update({
              where: { id: fileRecord.id },
              data: {
                sourceContentHash: contentHash,
              },
            })

            // Translate content
            const result = await engine.translate(content, fullRepository.config.baseLanguage, lang, {
              fileName: file.path,
              projectName: fullRepository.name,
            })

            totalTokens += result.usage.totalTokens

            // Collect file for batch commit (instead of immediate commit)
            const translatedFilePath = `i18n/${lang}/${file.path}`
            const translatedContentHash = createHash('sha256').update(result.text).digest('hex')

            if (!filesToCommit.has(lang)) {
              filesToCommit.set(lang, [])
            }

            filesToCommit.get(lang)!.push({
              path: translatedFilePath,
              content: result.text,
              fileRecordId: fileRecord.id,
              tokensUsed: result.usage.totalTokens,
            })

            // Update file record with translated content hash (status will be updated later)
            await prisma.translationFile.update({
              where: { id: fileRecord.id },
              data: {
                translatedContentHash: translatedContentHash,
                tokensUsed: result.usage.totalTokens,
              },
            })
          }
        } catch (error) {
          console.error(`Error processing file ${file.path} for language ${lang}:`, error)
          failedFiles++

          // Update file record with error if it exists
          if (fileRecord) {
            await prisma.translationFile.update({
              where: { id: fileRecord.id },
              data: {
                status: 'failed',
                errorMessage: `Processing failed: ${error instanceof Error ? error.message : String(error)}`,
                completedAt: new Date(),
              },
            }).catch((e) => {
              console.error('Failed to update file record:', e)
            })
          }
        }
      }
    }

    // Commit files by language using Git Tree API
    console.log(`[Translate] Starting to commit files for ${filesToCommit.size} languages...`)

    let latestCommitSha = currentSha

    for (const [lang, files] of filesToCommit.entries()) {
      try {
        console.log(`[Translate] Processing ${lang}: ${files.length} files`)

        // Create blobs for all files
        const treeItems = await Promise.all(files.map(async (file) => {
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
        }))

        // Create tree with all files for this language
        const { data: tree } = await octokit.rest.git.createTree({
          owner: fullRepository.fullName.split('/')[0],
          repo: fullRepository.fullName.split('/')[1],
          base_tree: latestCommitSha,
          tree: treeItems,
        })

        // Create commit for this language
        const { data: commit } = await octokit.rest.git.createCommit({
          owner: fullRepository.fullName.split('/')[0],
          repo: fullRepository.fullName.split('/')[1],
          message: `docs: translate to ${lang.toUpperCase()} (${files.length} files)`,
          tree: tree.sha,
          parents: [latestCommitSha],
        })

        console.log(`[Translate] Created commit for ${lang}: ${commit.sha}`)

        // Update branch reference to point to the new commit
        await octokit.rest.git.updateRef({
          owner: fullRepository.fullName.split('/')[0],
          repo: fullRepository.fullName.split('/')[1],
          ref: `heads/${branchName}`,
          sha: commit.sha,
        })

        // Update latest commit SHA for next language
        latestCommitSha = commit.sha

        // Update file records status
        await Promise.all(files.map(file =>
          prisma.translationFile.update({
            where: { id: file.fileRecordId },
            data: {
              status: 'completed',
              completedAt: new Date(),
            },
          })
        ))

        processedFiles += files.length
      } catch (error) {
        console.error(`[Translate] Error committing files for ${lang}:`, error)
        failedFiles += files.length

        // Update file records as failed
        await Promise.all(files.map(file =>
          prisma.translationFile.update({
            where: { id: file.fileRecordId },
            data: {
              status: 'failed',
              errorMessage: `Commit failed: ${error instanceof Error ? error.message : String(error)}`,
              completedAt: new Date(),
            },
          })
        ))
      }
    }

    // Create unified PR for all languages
    let prNumber: number | null = null
    let prUrl: string | null = null

    try {
      const prTitle = `docs: I18n Translation Update (${new Date().toLocaleDateString('zh-CN')})`

      // Build language breakdown for PR description
      const languageList = Array.from(filesToCommit.entries()).map(([lang, files]) => {
        return `- **${lang.toUpperCase()}**: ${files.length} files`
      }).join('\n')

      // Build file list example (first 10 files)
      const sampleFiles = Array.from(filesToCommit.entries())
        .flatMap(([lang, files]) =>
          files.slice(0, 3).map(f => `i18n/${lang}/${f.filePath}`)
        )
        .slice(0, 10)
        .map(f => `- ${f}`)
        .join('\n')

      const prBody = `## 🌐 Internationalization Translation

This pull request contains automated translations for multiple languages.

### 📊 Statistics
- **Languages**: ${filesToCommit.size}
- **Total Files**: ${processedFiles}
- **Failed Files**: ${failedFiles}
- **Tokens Used**: ${totalTokens.toLocaleString()}

### 📝 Language Breakdown
${languageList}

### 📁 File Structure
Translations are organized under \`i18n/{lang}/\` directory:

\`\`\`
i18n/
${Array.from(filesToCommit.keys()).map(lang => `├── ${lang}/`).join('')}
│   └── ...
\`\`\`

### 📝 Sample Files
${sampleFiles}
${filesToCommit.size > 0 && Array.from(filesToCommit.values()).flat().length > 10 ? '...\n*(Showing first 10 files)*' : ''}

---

🤖 Generated by [GitHub Global](https://github.com/apps/i18n-github-global) - Automated Translation Tool

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
      console.log(`[Translate] Created unified PR #${pr.number}`)

      // Update all file records with PR number
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

    // Update task as completed
    // Status logic: if all files failed -> 'failed', otherwise -> 'completed'
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

    // Create completion history entry with PR info
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

    // Update task as failed
    await prisma.translationTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        errorMessage: String(error),
        completedAt: new Date(),
      },
    })

    // Create failure history entry
    await prisma.translationHistory.create({
      data: {
        taskId,
        repositoryId: fullRepository.id,
        eventType: 'failed',
        eventData: {
          error: String(error),
          timestamp: new Date().toISOString(),
        },
      },
    })
  }
}

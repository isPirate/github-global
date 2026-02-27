import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { translationQueue } from '@/lib/translation/queue'
import { OpenRouterEngine } from '@/lib/translation/openrouter'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from 'octokit'

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

    const treeSha = refData.object.sha
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

            // Update source content hash
            await prisma.translationFile.update({
              where: { id: fileRecord.id },
              data: {
                sourceContentHash: Buffer.from(content).toString('base64'),
              },
            })

            // Translate content
            const result = await engine.translate(content, fullRepository.config.baseLanguage, lang, {
              fileName: file.path,
              projectName: fullRepository.name,
            })

            totalTokens += result.usage.totalTokens

            // Create branch for this language
            const branchName = fullRepository.config.targetBranchTemplate.replace(
              '{lang}',
              lang
            )

            try {
              // Check if branch exists
              await octokit.rest.git.getRef({
                owner: fullRepository.fullName.split('/')[0],
                repo: fullRepository.fullName.split('/')[1],
                ref: `heads/${branchName}`,
              })
            } catch {
              // Branch doesn't exist, create it
              await octokit.rest.git.createRef({
                owner: fullRepository.fullName.split('/')[0],
                repo: fullRepository.fullName.split('/')[1],
                ref: `refs/heads/${branchName}`,
                sha: refData.object.sha,
              })
            }

            // Create or update file in the language branch
            const translatedFilePath = file.path.replace(
              /\/[^/]+\.md$/,
              `/${lang}/${file.path.split('/').pop()}`
            )

            try {
              // Check if file already exists in the target branch
              let fileParams: any = {
                owner: fullRepository.fullName.split('/')[0],
                repo: fullRepository.fullName.split('/')[1],
                path: translatedFilePath,
                message: fullRepository.config.commitMessageTemplate.replace('{lang}', lang),
                content: Buffer.from(result.text).toString('base64'),
                branch: branchName,
              }

              // Try to get the current file to check if it exists
              try {
                const { data: existingFile } = await octokit.rest.repos.getContent({
                  owner: fullRepository.fullName.split('/')[0],
                  repo: fullRepository.fullName.split('/')[1],
                  path: translatedFilePath,
                  ref: `heads/${branchName}`,
                })

                // File exists, include sha for update
                if ('sha' in existingFile) {
                  fileParams.sha = existingFile.sha
                }
              } catch {
                // File doesn't exist, don't include sha (create new file)
                console.log(`[Translate] Creating new file: ${translatedFilePath}`)
              }

              await octokit.rest.repos.createOrUpdateFileContents(fileParams)

              // Update file record as completed
              await prisma.translationFile.update({
                where: { id: fileRecord.id },
                data: {
                  status: 'completed',
                  translatedContentHash: Buffer.from(result.text).toString('base64'),
                  tokensUsed: result.usage.totalTokens,
                  completedAt: new Date(),
                },
              })

              processedFiles++
            } catch (error) {
              console.error(`Error creating file ${translatedFilePath}:`, error)
              failedFiles++

              await prisma.translationFile.update({
                where: { id: fileRecord.id },
                data: {
                  status: 'failed',
                  errorMessage: String(error),
                  completedAt: new Date(),
                },
              })
            }
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

    // Create Pull Requests for each target language
    const pullRequests: { lang: string; prNumber: number; prUrl: string }[] = []

    for (const lang of targetLanguages) {
      try {
        const branchName = fullRepository.config.targetBranchTemplate.replace('{lang}', lang)

        // Check if PR already exists for this branch
        const { data: existingPrs } = await octokit.rest.pulls.list({
          owner: fullRepository.fullName.split('/')[0],
          repo: fullRepository.fullName.split('/')[1],
          head: `${fullRepository.fullName.split('/')[0]}:${branchName}`,
          base: 'main',
          state: 'open',
        })

        if (existingPrs.length > 0) {
          // PR already exists, update the translation files with PR number
          console.log(`[Translate] PR already exists for ${lang}: #${existingPrs[0].number}`)
          pullRequests.push({
            lang,
            prNumber: existingPrs[0].number,
            prUrl: existingPrs[0].html_url,
          })

          // Update translation files with PR number
          await prisma.translationFile.updateMany({
            where: {
              taskId,
              targetLanguage: lang,
            },
            data: {
              prNumber: existingPrs[0].number,
            },
          })

          continue
        }

        // Create new PR
        const prTitle = `docs: Translate to ${lang.toUpperCase()}`
        const prBody = `## Translation Summary

This pull request contains automated translations to **${lang.toUpperCase()}**.

### 📊 Statistics
- **Target Language**: ${lang}
- **Files Translated**: ${processedFiles}
- **Tokens Used**: ${totalTokens.toLocaleString()}
- **Status**: ${failedFiles > 0 ? `⚠️ ${failedFiles} file(s) failed` : '✅ All files successful'}

### 📝 Translated Files
${await prisma.translationFile.findMany({
          where: {
            taskId,
            targetLanguage: lang,
            status: 'completed',
          },
          select: {
            filePath: true,
          },
        }).then(files => files.map(f => `- \`${f.filePath}\``).join('\n'))}

---

🤖 Generated by [GitHub Global](https://github.com/apps/i18n-github-global) - Automated Translation Tool

**Note**: Please review the translations before merging. You can make additional edits if needed.`

        const { data: pr } = await octokit.rest.pulls.create({
          owner: fullRepository.fullName.split('/')[0],
          repo: fullRepository.fullName.split('/')[1],
          title: prTitle,
          body: prBody,
          head: branchName,
          base: 'main',
          maintainer_can_modify: true, // Allow maintainers to push changes
        })

        console.log(`[Translate] Created PR #${pr.number} for ${lang}`)
        pullRequests.push({
          lang,
          prNumber: pr.number,
          prUrl: pr.html_url,
        })

        // Update translation files with PR number
        await prisma.translationFile.updateMany({
          where: {
            taskId,
            targetLanguage: lang,
          },
          data: {
            prNumber: pr.number,
          },
        })

        // Create PR history entry
        await prisma.translationHistory.create({
          data: {
            taskId,
            repositoryId: fullRepository.id,
            eventType: 'pr_created',
            eventData: {
              language: lang,
              prNumber: pr.number,
              prUrl: pr.html_url,
              branch: branchName,
            },
          },
        })
      } catch (error) {
        console.error(`Error creating PR for ${lang}:`, error)

        // Create PR failure history entry
        await prisma.translationHistory.create({
          data: {
            taskId,
            repositoryId: fullRepository.id,
            eventType: 'pr_failed',
            eventData: {
              language: lang,
              error: error instanceof Error ? error.message : String(error),
            },
          },
        })
      }
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
          pullRequests,
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

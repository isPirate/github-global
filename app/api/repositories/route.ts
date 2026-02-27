import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from 'octokit'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get GitHub App credentials
    const appId = process.env.GITHUB_APP_ID
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY

    if (!appId || !privateKey) {
      return NextResponse.json(
        { error: 'GitHub App credentials not configured' },
        { status: 500 }
      )
    }

    // Step 1: Get current installations from GitHub (real-time check)
    let githubInstallations: any[] = []
    try {
      const auth = createAppAuth({
        appId: parseInt(appId),
        privateKey: privateKey,
      })

      const appAuth = await auth({
        type: 'app',
      })

      const octokit = new Octokit({
        auth: appAuth.token,
      })

      const installationsResponse = await octokit.rest.apps.listInstallations({
        per_page: 100,
      })

      // Filter installations for the current user
      const userInstallations = installationsResponse.data.filter(
        (inst: any) => inst.account.login === session.user.username
      )

      githubInstallations = userInstallations
      console.log(`[API] Found ${userInstallations.length} active installations for user: ${session.user.username}`)
    } catch (error) {
      console.error('[API] Error fetching installations from GitHub:', error)
    }

    // Step 2: Sync installations to database
    const syncedInstallationIds: string[] = []
    for (const githubInst of githubInstallations) {
      try {
        await prisma.gitHubAppInstallation.upsert({
          where: { installationId: BigInt(githubInst.id) },
          create: {
            userId: session.user.id,
            installationId: BigInt(githubInst.id),
            githubAccountId: BigInt(githubInst.account.id),
            accountLogin: githubInst.account.login,
            accountType: githubInst.account.type || 'User',
            permissions: githubInst.permissions || {},
            repositorySelection: githubInst.repository_selection || 'all',
          },
          update: {
            accountLogin: githubInst.account.login,
            accountType: githubInst.account.type || 'User',
            permissions: githubInst.permissions || {},
            repositorySelection: githubInst.repository_selection || 'all',
          },
        })

        syncedInstallationIds.push(githubInst.id.toString())
        console.log(`[API] Synced installation: ${githubInst.id}`)
      } catch (error) {
        console.error(`[API] Failed to sync installation ${githubInst.id}:`, error)
      }
    }

    // Step 3: Clean up installations that no longer exist in GitHub
    const dbInstallations = await prisma.gitHubAppInstallation.findMany({
      where: {
        userId: session.user.id,
      },
    })

    for (const dbInst of dbInstallations) {
      const instId = dbInst.installationId.toString()
      if (!syncedInstallationIds.includes(instId)) {
        // This installation no longer exists in GitHub, delete it
        await prisma.gitHubAppInstallation.delete({
          where: { id: dbInst.id },
        })
        console.log(`[API] Cleaned up stale installation: ${instId}`)
      }
    }

    // Step 4: If no installations, return empty
    if (syncedInstallationIds.length === 0) {
      console.log('[API] No installations found for user')
      return NextResponse.json({
        installations: [],
        repositories: [],
      })
    }

    // Step 5: Get repositories from each installation
    const allRepositories: any[] = []

    for (const instId of syncedInstallationIds) {
      try {
        const auth = createAppAuth({
          appId: parseInt(appId),
          privateKey: privateKey,
        })

        const installationAuthentication = await auth({
          type: 'installation',
          installationId: parseInt(instId),
        })

        const octokit = new Octokit({
          auth: installationAuthentication.token,
        })

        // Get repositories for this installation
        const reposResponse = await octokit.rest.apps.listReposAccessibleToInstallation({
          per_page: 100,
        })

        console.log(`[API] Installation ${instId}:`, {
          total_count: reposResponse.data.total_count,
          repos_count: reposResponse.data.repositories?.length || 0,
        })

        if (reposResponse.data.repositories && Array.isArray(reposResponse.data.repositories)) {
          // Add installation ID to each repository
          const reposWithInstallation = reposResponse.data.repositories.map((repo: any) => ({
            ...repo,
            _installationId: instId, // Store the installation ID that owns this repo
          }))
          allRepositories.push(...reposWithInstallation)
        }
      } catch (error) {
        console.error(`[API] Error fetching repos for installation ${instId}:`, error)
      }
    }

    console.log(`[API] Total repositories fetched: ${allRepositories.length}`)

    // Step 6: Get database installations to get their UUIDs
    console.log('[API] Looking for installations with IDs:', syncedInstallationIds)
    const activeInstallations = await prisma.gitHubAppInstallation.findMany({
      where: {
        userId: session.user.id,
        installationId: {
          in: syncedInstallationIds.map((id) => BigInt(id)),
        },
      },
    })

    console.log('[API] Found active installations in DB:', activeInstallations.length)
    console.log('[API] Active installations:', activeInstallations.map(i => ({ id: i.id, installationId: i.installationId.toString() })))

    const installationIds = activeInstallations.map((inst) => inst.id)

    // Get repositories from database
    const dbRepositories = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
        installationId: {
          in: installationIds,
        },
      },
      include: {
        config: true,
      },
    })

    console.log(`[API] Found ${dbRepositories.length} repositories in database`)

    // Step 7: Auto-sync repositories - create records for new repos
    const dbRepoIds = new Set(dbRepositories.map((r) => r.githubRepoId.toString()))

    console.log('[API] Existing DB repo IDs:', Array.from(dbRepoIds))

    for (const repo of allRepositories) {
      const repoId = repo.id.toString()
      if (!dbRepoIds.has(repoId)) {
        // This repository exists in GitHub but not in database, create it
        try {
          // Use the _installationId we stored earlier
          const githubInstallationId = repo._installationId

          console.log(`[API] Creating repo ${repo.full_name}, installation ID: ${githubInstallationId}`)

          const installation = activeInstallations.find(
            (inst) => inst.installationId.toString() === githubInstallationId.toString()
          )

          if (installation) {
            const createdRepo = await prisma.repository.create({
              data: {
                userId: session.user.id,
                installationId: installation.id,
                githubRepoId: BigInt(repo.id),
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description || null,
                language: repo.language || null,
                stargazersCount: repo.stargazers_count || 0,
                isActive: true, // Auto-enable
              },
            })
            console.log(`[API] Auto-synced repository: ${repo.full_name}, DB ID: ${createdRepo.id}`)
          } else {
            console.error(`[API] Cannot find installation for repo ${repo.full_name}, installation ID: ${githubInstallationId}`)
            console.error(`[API] Available installations:`, activeInstallations.map(i => i.installationId.toString()))
          }
        } catch (error) {
          console.error(`[API] Failed to create repository ${repo.full_name}:`, error)
        }
      }
    }

    // Step 8: Clean up repositories that no longer exist in GitHub
    for (const dbRepo of dbRepositories) {
      const exists = allRepositories.some((r) => r.id.toString() === dbRepo.githubRepoId.toString())
      if (!exists) {
        try {
          await prisma.repository.delete({
            where: { id: dbRepo.id },
          })
          console.log(`[API] Cleaned up stale repository: ${dbRepo.fullName}`)
        } catch (error) {
          console.error(`[API] Failed to delete repository ${dbRepo.fullName}:`, error)
        }
      }
    }

    // Step 9: Re-fetch repositories from database to get the updated list
    console.log('[API] Querying repositories with installationIds:', installationIds)
    const updatedDbRepositories = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
        installationId: {
          in: installationIds,
        },
      },
      include: {
        config: true,
      },
    })

    console.log('[API] Updated DB repositories count:', updatedDbRepositories.length)

    // Step 10: Combine GitHub repositories with database repositories
    console.log('[API] DB Repositories count:', updatedDbRepositories.length)
    console.log('[API] GitHub Repositories count:', allRepositories.length)

    const enrichedRepositories = allRepositories.map((repo: any) => {
      const dbRepo = updatedDbRepositories.find((r) => r.githubRepoId === BigInt(repo.id))

      if (!dbRepo) {
        console.log('[API] No DB repo found for GitHub repo:', repo.id, repo.full_name)
      }

      return {
        ...repo,
        isActive: dbRepo?.isActive ?? false,
        hasConfig: !!dbRepo?.config,
        dbId: dbRepo?.id,
      }
    })

    // Step 11: Format installations for response
    const installations = syncedInstallationIds.map((id) => {
      const dbInst = activeInstallations.find((inst) => inst.installationId.toString() === id)
      return {
        id,
        account: {
          login: dbInst?.accountLogin || session.user.username,
          type: dbInst?.accountType || 'User',
        },
      }
    })

    return NextResponse.json({
      installations,
      repositories: enrichedRepositories,
    })
  } catch (error) {
    console.error('[API] Error fetching repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories', message: String(error) },
      { status: 500 }
    )
  }
}

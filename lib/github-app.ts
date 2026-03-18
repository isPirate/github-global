/**
 * GitHub App integration utilities
 * Handles installation access tokens and repository management
 */

import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from 'octokit'

export interface GitHubAppConfig {
  appId: number
  privateKey: string
  installationId: number
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  stargazers_count: number
  private: boolean
  owner: {
    login: string
    type: string
  }
}

/**
 * Create an authenticated Octokit instance for a GitHub App installation
 */
export async function createInstallationClient(installationId: number): Promise<Octokit> {
  const appId = parseInt(process.env.GITHUB_APP_ID || '0')
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY || ''

  if (!appId || !privateKey) {
    throw new Error('GitHub App credentials not configured')
  }

  const auth = createAppAuth({
    appId,
    privateKey,
  })

  const installationAuthentication = await auth({
    type: 'installation',
    installationId,
  })

  return new Octokit({
    auth: installationAuthentication.token,
  })
}

/**
 * Create an authenticated Octokit instance for a user using a GitHub App user access token.
 */
export function createUserClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  })
}

/**
 * Get all repositories for a user from GitHub App installations
 */
export async function getUserRepositories(accessToken: string): Promise<{
  installations: Array<{
    id: number
    account: {
      login: string
      type: string
    }
  }>
  repositories: GitHubRepository[]
}> {
  const userClient = createUserClient(accessToken)

  // Get user's installations
  const installationsResponse =
    await userClient.rest.apps.listInstallationsForAuthenticatedUser()

  const installations = installationsResponse.data.installations

  // Get repositories for each installation
  const repositories: GitHubRepository[] = []

  for (const installation of installations) {
    try {
      const installationClient = await createInstallationClient(installation.id)

      const reposResponse = await installationClient.rest.apps.listReposAccessibleToInstallation({
        per_page: 100,
      })

      repositories.push(...reposResponse.data.repositories)
    } catch (error) {
      console.error(`Failed to fetch repos for installation ${installation.id}:`, error)
    }
  }

  return {
    installations: installations.map((inst) => ({
      id: inst.id,
      account: {
        login:
          inst.account && 'login' in inst.account
            ? inst.account.login
            : inst.account?.name || '',
        type:
          inst.account && 'login' in inst.account
            ? inst.account.type
            : 'Organization',
      },
    })),
    repositories,
  }
}

/**
 * Get repository details
 */
export async function getRepositoryDetails(
  installationId: number,
  owner: string,
  repoName: string
): Promise<GitHubRepository> {
  const client = await createInstallationClient(installationId)

  const response = await client.rest.repos.get({
    owner,
    repo: repoName,
  })

  return response.data as unknown as GitHubRepository
}

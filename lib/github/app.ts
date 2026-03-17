import jwt from 'jsonwebtoken'
import { Octokit } from 'octokit'
import type { InstallationAccessToken, GitHubInstallation } from './types'
import { getGitHubAppSlug } from '@/lib/config/app'

export class GitHubAppManager {
  private appId: string
  private privateKey: string
  private webhookSecret: string

  constructor() {
    this.appId = process.env.GITHUB_APP_ID || ''
    this.privateKey = process.env.GITHUB_APP_PRIVATE_KEY || ''
    this.webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET || ''

    if (!this.appId || !this.privateKey) {
      throw new Error('GitHub App credentials are not configured')
    }
  }

  generateAppJWT(): string {
    const payload = {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
      iss: this.appId,
    }

    const privateKey = this.privateKey.replace(/\\n/g, '\n')

    return jwt.sign(payload, privateKey, { algorithm: 'RS256' })
  }

  async getInstallationToken(installationId: number): Promise<InstallationAccessToken> {
    const appJWT = this.generateAppJWT()

    const octokit = new Octokit({
      auth: appJWT,
    })

    const response = await octokit.rest.apps.createInstallationAccessToken({
      installation_id: installationId,
    })

    return response.data as InstallationAccessToken
  }

  async getInstallationOctokit(installationId: number) {
    const token = await this.getInstallationToken(installationId)

    return new Octokit({
      auth: token.token,
    })
  }

  async getInstallationRepositories(installationId: number) {
    const octokit = await this.getInstallationOctokit(installationId)

    const response = await octokit.rest.apps.listReposAccessibleToInstallation({
      installation_id: installationId,
    })

    return response.data.repositories
  }

  async getInstallation(installationId: number): Promise<GitHubInstallation> {
    const appJWT = this.generateAppJWT()

    const octokit = new Octokit({
      auth: appJWT,
    })

    const response = await octokit.rest.apps.getInstallation({
      installation_id: installationId,
    })

    return response.data as unknown as GitHubInstallation
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hmac = require('crypto').createHmac('sha256', this.webhookSecret)
    const digest = 'sha256=' + hmac.update(payload).digest('hex')
    return signature === digest
  }

  getInstallationUrl(state: string): string {
    const appSlug = getGitHubAppSlug()
    return `https://github.com/apps/${appSlug}/installations/new?state=${state}`
  }
}

let gitHubAppManager: GitHubAppManager | null = null

export function getGitHubAppManager(): GitHubAppManager {
  if (!gitHubAppManager) {
    gitHubAppManager = new GitHubAppManager()
  }
  return gitHubAppManager
}

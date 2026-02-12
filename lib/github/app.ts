import jwt from 'jsonwebtoken'
import { Octokit } from 'octokit'
import type { InstallationAccessToken, GitHubInstallation } from './types'

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

  // 生成 GitHub App JWT（用于认证）
  generateAppJWT(): string {
    const payload = {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60, // 1分钟过期
      iss: this.appId,
    }

    const privateKey = this.privateKey.replace(/\\n/g, '\n')

    return jwt.sign(payload, privateKey, { algorithm: 'RS256' })
  }

  // 获取 installation access token（1小时有效）
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

  // 获取安装的仓库列表
  async getInstallationRepositories(installationId: number) {
    const token = await this.getInstallationToken(installationId)

    const octokit = new Octokit({
      auth: token.token,
    })

    const response = await octokit.rest.apps.listReposAccessibleToInstallation({
      installation_id: installationId,
    })

    return response.data.repositories
  }

  // 获取安装信息
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

  // 验证 webhook 签名
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hmac = require('crypto').createHmac('sha256', this.webhookSecret)
    const digest = 'sha256=' + hmac.update(payload).digest('hex')
    return signature === digest
  }

  // 生成安装 URL
  getInstallationUrl(state: string): string {
    const appName = process.env.GITHUB_APP_NAME
    return `https://github.com/apps/${appName}/installations/new?state=${state}`
  }
}

// 单例实例
let gitHubAppManager: GitHubAppManager | null = null

export function getGitHubAppManager(): GitHubAppManager {
  if (!gitHubAppManager) {
    gitHubAppManager = new GitHubAppManager()
  }
  return gitHubAppManager
}

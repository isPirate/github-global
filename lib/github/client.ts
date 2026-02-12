import { Octokit } from 'octokit'
import type { GitHubRepository } from './types'
import { getGitHubAppManager } from './app'

export class GitHubClient {
  private octokit: Octokit
  private installationId: number

  constructor(installationId: number) {
    this.installationId = installationId
    this.octokit = new Octokit({
      auth: async () => {
        const manager = getGitHubAppManager()
        const token = await manager.getInstallationToken(installationId)
        return token.token
      },
    })
  }

  // 获取仓库列表
  async listRepositories(): Promise<GitHubRepository[]> {
    const response = await this.octokit.rest.apps.listReposAccessibleToInstallation({
      installation_id: this.installationId,
    })

    return response.data.repositories as GitHubRepository[]
  }

  // 获取单个仓库
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const response = await this.octokit.rest.repos.get({
      owner,
      repo,
    })

    return response.data as unknown as GitHubRepository
  }

  // 创建 Webhook
  async createWebhook(
    owner: string,
    repo: string,
    config: {
      url: string
      secret: string
    }
  ) {
    const response = await this.octokit.rest.repos.createWebhook({
      owner,
      repo,
      name: 'web',
      active: true,
      events: ['push'],
      config: {
        url: config.url,
        content_type: 'json',
        secret: config.secret,
        insecure_ssl: false,
      },
    })

    return response.data
  }

  // 获取文件内容
  async getFileContent(owner: string, repo: string, path: string, ref: string = 'HEAD'): Promise<string> {
    const response = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    })

    if ('content' in response.data) {
      return Buffer.from(response.data.content, 'base64').toString('utf-8')
    }

    throw new Error('File not found')
  }

  // 创建分支
  async createBranch(owner: string, repo: string, branch: string, from: string): Promise<void> {
    // 获取 base commit SHA
    const { data: ref } = await this.octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${from}`,
    })

    // 创建新分支
    await this.octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: ref.object.sha,
    })
  }

  // 创建或更新文件
  async createFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    branch: string,
    message: string
  ): Promise<void> {
    const contentBase64 = Buffer.from(content).toString('base64')

    try {
      // 先尝试获取文件，看是否存在
      await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      })

      // 文件存在，更新它
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        branch,
        content: contentBase64,
        message,
      })
    } catch (error) {
      // 文件不存在，创建新文件
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        branch,
        content: contentBase64,
        message,
      })
    }
  }

  // 创建 Pull Request
  async createPR(
    owner: string,
    repo: string,
    options: {
      title: string
      body: string
      head: string
      base: string
      labels?: string[]
    }
  ) {
    const response = await this.octokit.rest.pulls.create({
      owner,
      repo,
      title: options.title,
      body: options.body,
      head: options.head,
      base: options.base,
      labels: options.labels || ['translation', 'automated'],
    })

    return response.data
  }

  // 获取 Git Diff
  async getCommitDiff(owner: string, repo: string, base: string, head: string) {
    const response = await this.octokit.rest.repos.compareCommits({
      owner,
      repo,
      base,
      head,
    })

    return response.data.files || []
  }
}

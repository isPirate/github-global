export interface GitHubUser {
  id: number
  login: string
  email: string | null
  avatar_url: string
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
    id: number
  }
}

export interface GitHubInstallation {
  id: number
  account: {
    login: string
    id: number
    type: 'User' | 'Organization'
  }
  repository_selection: 'all' | 'selected'
  permissions: Record<string, string>
}

export interface GitHubPushEvent {
  ref: string
  before: string
  after: string
  repository: {
    id: number
    name: string
    full_name: string
    private: boolean
    owner: {
      login: string
      id: number
    }
  }
  pusher: {
    name: string
    email: string
  }
  commits: Array<{
    id: string
    message: string
    added: string[]
    removed: string[]
    modified: string[]
  }>
}

export interface InstallationAccessToken {
  token: string
  expires_at: string
  permissions: Record<string, string>
  repository_selection: string
}

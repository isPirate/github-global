/**
 * GitHub API fetch wrapper with proper Next.js server configuration
 * This handles the undici fetch issues in Node.js server environment
 */

export interface GitHubTokenResponse {
  access_token: string
  token_type: string
  scope: string
}

export interface GitHubUser {
  id: number
  login: string
  email: string | null
  avatar_url: string
}

export interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
  visibility: string | null
}

/**
 * Fetch with Next.js specific configuration to avoid undici timeout issues
 */
export async function githubFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Remove signal from options to avoid abort issues
  const { signal, ...restOptions } = options

  const response = await fetch(url, {
    ...restOptions,
    // Next.js specific options for server-side fetch
    // @ts-ignore - Next.js extends fetch options
    cache: 'no-store',
    // @ts-ignore
    next: {
      revalidate: 0,
    },
  })

  return response
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<GitHubTokenResponse> {
  const response = await githubFetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': 'GitHub-Global-App',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }).toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error_description || data.error)
  }

  return data
}

/**
 * Fetch GitHub user profile
 */
export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await githubFetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'GitHub-Global-App',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch user: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Fetch GitHub user emails
 */
export async function fetchGitHubEmails(accessToken: string): Promise<GitHubEmail[]> {
  const response = await githubFetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'GitHub-Global-App',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch emails: ${response.status} ${errorText}`)
  }

  return response.json()
}

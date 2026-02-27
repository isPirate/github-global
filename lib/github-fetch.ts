/**
 * GitHub API fetch wrapper using Node.js https module
 * Supports proxy via HTTP_PROXY or HTTPS_PROXY environment variables
 */

import { HttpsProxyAgent } from 'https-proxy-agent'
import { request as httpRequest } from 'https'

// Get proxy URL from environment
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || ''

// Proxy agent for all requests
const proxyAgent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined

if (PROXY_URL) {
  console.log('[GitHubFetch] Using proxy:', PROXY_URL.replace(/\/\/[^@]+@/, '//***@'))
}

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
 * Make an HTTPS request with optional proxy support
 */
function makeRequest(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
  } = {}
): Promise<{ data: any; statusCode: number }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'

    const reqOpts: any = {
      method: options.method || 'GET',
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      headers: options.headers || {},
      agent: proxyAgent,
    }

    const req = httpRequest(reqOpts, (res: any) => {
      let data = ''

      res.on('data', (chunk: any) => {
        data += chunk
      })

      res.on('end', () => {
        resolve({ data, statusCode: res.statusCode })
      })
    })

    req.on('error', (error: Error) => {
      reject(error)
    })

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<GitHubTokenResponse> {
  const url = 'https://github.com/login/oauth/access_token'
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
  }).toString()

  try {
    const { data, statusCode } = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': 'GitHub-Global-App',
      },
      body,
    })

    if (statusCode !== 200) {
      throw new Error(`Token exchange failed: ${statusCode} ${data}`)
    }

    const result = JSON.parse(data)

    if (result.error) {
      throw new Error(result.error_description || result.error)
    }

    return result
  } catch (error) {
    console.error('[GitHubFetch] Token exchange failed:', error)
    throw error
  }
}

/**
 * Fetch GitHub user profile
 */
export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const { data, statusCode } = await makeRequest('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'GitHub-Global-App',
    },
  })

  if (statusCode !== 200) {
    throw new Error(`Failed to fetch user: ${statusCode} ${data}`)
  }

  return JSON.parse(data)
}

/**
 * Fetch GitHub user emails
 */
export async function fetchGitHubEmails(accessToken: string): Promise<GitHubEmail[]> {
  const { data, statusCode } = await makeRequest('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'GitHub-Global-App',
    },
  })

  if (statusCode !== 200) {
    throw new Error(`Failed to fetch emails: ${statusCode} ${data}`)
  }

  return JSON.parse(data)
}

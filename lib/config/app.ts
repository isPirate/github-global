function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function getAppBaseUrl() {
  const value = process.env.APP_BASE_URL || 'http://localhost:3000'
  return trimTrailingSlash(value)
}

export function getGitHubAppClientId() {
  return process.env.GITHUB_APP_CLIENT_ID?.trim() || ''
}

export function getGitHubAppClientSecret() {
  return process.env.GITHUB_APP_CLIENT_SECRET?.trim() || ''
}

export function getGitHubAppUserCallbackUrl() {
  const explicitCallbackUrl = process.env.GITHUB_APP_USER_CALLBACK_URL?.trim()
  if (explicitCallbackUrl) {
    return trimTrailingSlash(explicitCallbackUrl)
  }

  return `${getAppBaseUrl()}/api/auth/callback`
}

export function getGitHubAppSlug() {
  return process.env.GITHUB_APP_SLUG?.trim() || ''
}

export function getGitHubAppWebhookUrl() {
  const explicitWebhookUrl = process.env.GITHUB_APP_WEBHOOK_URL?.trim()
  if (explicitWebhookUrl) {
    return trimTrailingSlash(explicitWebhookUrl)
  }

  return `${getAppBaseUrl()}/api/webhooks/github`
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function getAppBaseUrl() {
  const value = process.env.APP_BASE_URL || 'http://localhost:3000'
  return trimTrailingSlash(value)
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

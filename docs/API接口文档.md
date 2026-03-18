# GitHub Global API 接口文档

更新时间：2026-03-17

本文档基于当前仓库 `app/api/**/route.ts` 源码整理，用于后续联调、排障和页面开发时快速查阅。

## 统计

- 路由文件数：24
- 接口路径数：24
- HTTP 方法总数：29
- 主要分组：`Auth`、`GitHub App`、`Repositories`、`Tasks`、`User Settings`、`OpenRouter`、`Webhooks`、`Debug`

## 鉴权说明

- `公开`：无需登录即可访问。
- `登录态`：依赖 `session` cookie 或 `getSession()`。
- `Webhook 签名`：依赖 GitHub Webhook 请求头签名校验。

## 返回约定

- 成功时大多返回 `200 OK` + JSON。
- 常见失败状态：
  - `400` 参数错误或业务前置条件不满足
  - `401` 未登录或签名无效
  - `403` 有登录态但无权限
  - `404` 资源不存在
  - `409` 资源冲突
  - `500` 服务端异常或第三方集成异常

## 1. Auth

### `GET /api/auth/signin`

- 鉴权：公开
- 作用：跳转到 GitHub OAuth 授权页
- 请求参数：无
- 成功返回：302 重定向到 GitHub
- 失败返回：
  - `500` GitHub OAuth 环境变量未配置

### `GET /api/auth/callback`

- 鉴权：公开
- 作用：处理 GitHub OAuth 回调，创建或更新用户并写入 session
- Query 参数：
  - `code`：GitHub OAuth 返回的授权码
  - `error`：GitHub 返回的错误码
  - `error_description`：错误描述
- 成功返回：302 重定向到 `/dashboard`
- 失败返回：302 重定向到首页，并在 URL 上带错误参数

### `GET /api/auth/me`

- 鉴权：登录态
- 作用：获取当前会话用户信息
- 成功返回示例：

```json
{
  "user": {
    "id": "user_id",
    "githubId": "123",
    "username": "alice",
    "email": "alice@example.com",
    "avatarUrl": "https://..."
  }
}
```

### `POST /api/auth/signout`

### `GET /api/auth/signout`

- 鉴权：登录态
- 作用：删除 session 并跳回首页
- 成功返回：302 重定向到 `/`

## 2. GitHub App

### `GET /api/github-app/install-link`

- 鉴权：登录态
- 作用：根据 `GITHUB_APP_ID` 与 `GITHUB_APP_SLUG` 返回当前 GitHub App 的安装链接
- 成功返回字段：
  - `appId`
  - `slug`
  - `installationUrl`
  - `appUrl`
  - `appName`
- 可能返回：
  - `401` 未登录或 session 内无 `accessToken`
  - `500` `GITHUB_APP_ID` 未配置或请求失败

### `GET /api/github-app/installation-url`

- 鉴权：公开
- 作用：根据 `GITHUB_APP_SLUG` 推导安装页 URL
- 成功返回字段：
  - `installationUrl`
  - `appUrl`
  - `appName`
  - `appSlug`

### `GET /api/github-app/installations`

- 鉴权：弱依赖登录态
- 作用：读取 GitHub App 当前所有安装记录，并尽量附带当前 cookie 中的用户信息
- 说明：这个接口没有强制调用 `getSession()`，但会尝试解析 `session` cookie
- 成功返回字段：
  - `success`
  - `total`
  - `installations`
  - `currentUser`

### `POST /api/github-app/sync`

- 鉴权：登录态
- 作用：通过当前用户 OAuth token 拉取“该用户已安装的当前 GitHub App”，并同步到数据库
- 请求体：无
- 成功返回字段：
  - `success`
  - `message`
  - `synced`
- 可能返回：
  - `401` 未登录
  - `404` 用户不存在
  - `500` GitHub App 配置缺失或 GitHub API 请求失败

### `POST /api/github-app/auto-sync`

- 鉴权：登录态
- 作用：直接读取 GitHub App 的全部 installation，再按 `session.user.username` 过滤并同步到数据库
- 请求体：无
- 成功返回字段：
  - `success`
  - `message`
  - `synced`
  - 若未找到安装，返回 `found: 0`
- 说明：与 `/sync` 相比，这个接口更偏“后台全量对账”

## 3. Repositories

### `GET /api/repositories`

- 鉴权：登录态
- 作用：同步并返回当前用户可访问的 GitHub 仓库列表，同时补齐数据库中的仓库记录
- 主要流程：
  - 拉取 GitHub App 安装列表
  - 同步安装到数据库
  - 拉取各 installation 下的仓库
  - 自动创建缺失的仓库记录
  - 删除 GitHub 已不存在的旧仓库记录
- 成功返回字段：
  - `installations`
  - `repositories`
- `repositories` 附加字段：
  - `isActive`
  - `hasConfig`
  - `dbId`

### `POST /api/repositories/add`

- 鉴权：登录态
- 作用：手动把一个仓库写入数据库
- 请求体字段：
  - `githubRepoId` 必填
  - `installationId` 必填，GitHub installation ID
  - `fullName` 必填，格式 `owner/repo`
  - `description` 可选
  - `language` 可选
  - `stargazersCount` 可选
- 成功返回字段：
  - `success`
  - `repository`
- 可能返回：
  - `400` 缺少必填字段
  - `403` installation 不属于当前用户
  - `404` installation 不存在
  - `409` 仓库已存在

### `DELETE /api/repositories/[id]`

- 鉴权：登录态
- 作用：删除仓库记录
- 路径参数：
  - `id`：数据库仓库 ID
- 成功返回：

```json
{
  "success": true
}
```

- 可能返回：
  - `403` 仓库不属于当前用户
  - `404` 仓库不存在

### `GET /api/repositories/[id]/config`

- 鉴权：登录态
- 作用：获取仓库翻译配置和翻译引擎信息
- 路径参数：
  - `id`：数据库仓库 ID
- 成功返回字段：
  - `config`
  - `engines`
  - `userSettings.hasOpenRouterKey`
  - `repository`
- `engines` 中不会返回完整 API Key，只会返回 `hasApiKey`
- `config` 当前会返回已归一化的 `baseLanguage`、`targetLanguages`、`scopeMode`、`selectedFiles`，以及与当前 scope 对应的 `filePatterns` / `excludePatterns`
- 若仓库还没有保存过配置，接口会返回一份“默认配置”，其中 `targetLanguages` 会优先取当前用户设置里的 `defaultTargetLanguages`
- `userSettings.hasOpenRouterKey` 用于前端判断当前是否可以在不填写仓库级 Key 的情况下继续保存配置

### `POST /api/repositories/[id]/config`

- 鉴权：登录态
- 作用：创建或更新仓库翻译配置，并创建或更新翻译引擎
- 路径参数：
  - `id`：数据库仓库 ID
- 请求体字段：
  - `baseLanguage`
  - `targetLanguages`：必填，非空数组，且会自动剔除与基准语言相同的值
  - `scopeMode`：`preset_common_docs` / `preset_readme_docs` / `preset_all_markdown` / `manual_selection` / `advanced_rules`
  - `selectedFiles`：手动选文件模式下使用
  - `filePatterns`：仅高级规则模式必填
  - `excludePatterns`：仅高级规则模式使用
  - `targetBranchTemplate`
  - `commitMessageTemplate`
  - `syncStrategy`
  - `triggerMode`
  - `engine`：必填
- `engine` 字段：
  - `id`：已有引擎时用于更新
  - `engineType`
  - `apiKey`：新建引擎时通常必填；若用户已在 Settings 配置全局 OpenRouter Key，则允许留空并在运行时回退使用用户级 key
  - `config`
  - `isActive`
- 成功返回字段：
  - `config`
  - `engine`
- 可能返回：
  - `400` `targetLanguages` 或 `filePatterns` 不合法
  - `400` `manual_selection` 模式下未提供 `selectedFiles`
  - `400` 缺少引擎配置
  - `400` 新引擎缺少 `apiKey` 且用户级 OpenRouter Key 也未配置
  - `404` 仓库不存在

### `POST /api/repositories/[id]/enable`

- 鉴权：登录态
- 作用：启用仓库翻译功能
- 前置条件：仓库必须已存在配置
- 成功返回字段：
  - `success`
  - `repository`
- 可能返回：
  - `400` 未配置翻译参数
  - `404` 仓库不存在

### `POST /api/repositories/[id]/disable`

- 鉴权：登录态
- 作用：禁用仓库翻译功能
- 成功返回字段：
  - `success`
  - `repository`

### `POST /api/repositories/[id]/translate`

- 鉴权：登录态
- 作用：手动触发翻译任务，创建 `translationTask` 并压入队列
- 前置条件：
  - 仓库存在
  - 仓库已配置
  - 仓库已启用
  - 至少存在一个启用中的翻译引擎
- 成功返回示例：

```json
{
  "success": true,
  "taskId": "task_id",
  "message": "Translation task created successfully"
}
```

- 可能返回：
  - `400` 未配置、未启用或无可用引擎
  - `404` 仓库不存在

### `GET /api/repositories/[id]/files`

- 鉴权：登录态
- 作用：获取仓库候选文档文件列表，用于配置页手动勾选翻译范围
- 路径参数：
  - `id`：数据库仓库 ID
- 成功返回字段：
  - `files`
  - `totalCount`
  - `defaultBranch`
- `files` 单项字段：
  - `path`
  - `directory`
  - `extension`
  - `isDocumentationCandidate`
- 说明：
  - 当前优先返回文档类候选文件，如 `README*`、`docs/**`、`*.md`、`*.mdx`、`*.txt`
  - 用于配置页“手动选择文件”模式，不直接创建翻译任务

### `GET /api/repositories/[id]/translations`

- 鉴权：登录态
- 作用：获取某个仓库的翻译任务历史
- 路径参数：
  - `id`：数据库仓库 ID
- Query 参数：
  - `limit`：默认 `20`
  - `offset`：默认 `0`
- 成功返回字段：
  - `tasks`
  - `totalCount`
  - `limit`
  - `offset`

## 4. Tasks

### `GET /api/tasks`

- 鉴权：登录态
- 作用：分页获取当前用户全部翻译任务
- Query 参数：
  - `limit`：默认 `20`
  - `offset`：默认 `0`
  - `status`：可选，任务状态
  - `repositoryId`：可选
  - `search`：可选，按仓库 `name` / `fullName` 模糊搜索
- 成功返回字段：
  - `tasks`
  - `totalCount`
  - `limit`
  - `offset`
- 说明：
  - `tasks` 会附带 `repository`
  - `files` 最多返回最近 50 条

### `GET /api/tasks/[id]`

- 鉴权：登录态
- 作用：获取单个任务详情
- 路径参数：
  - `id`：任务 ID
- 成功返回字段：
  - `task`
- 说明：
  - 会附带 `repository`
  - 会附带全部 `files`
  - 会附带按时间升序的 `history`

### `POST /api/tasks/[id]`

- 鉴权：登录态
- 作用：重试失败任务
- 路径参数：
  - `id`：任务 ID
- 前置条件：任务状态必须为 `failed`
- 成功返回示例：

```json
{
  "success": true,
  "message": "Task queued for retry"
}
```

- 可能返回：
  - `400` 任务不是失败状态
  - `404` 任务不存在

## 5. User Settings

### `GET /api/user/settings`

- 鉴权：登录态
- 作用：获取当前用户设置；如果还没有设置记录，会自动创建默认值
- 成功返回字段：
  - `settings.defaultTargetLanguages`
  - `settings.hasOpenRouterKey`

### `POST /api/user/settings`

- 鉴权：登录态
- 作用：更新当前用户设置
- 请求体可选字段：
  - `defaultTargetLanguages`
  - `openRouterKey`
- 说明：
  - `openRouterKey` 会在服务端加密后存储
  - 传空值会清空已存储 key
  - `defaultTargetLanguages` 会在服务端做去重和清洗，并作为新仓库配置页的默认目标语言来源
  - 翻译任务当前默认创建分支并自动提交 PR，同时保留任务历史；这些行为不再作为用户偏好设置暴露
- 成功返回字段：
  - `success`
  - `settings`

## 6. OpenRouter

### `GET /api/openrouter/models`

- 鉴权：公开
- 作用：获取 OpenRouter 模型列表
- 缓存策略：`revalidate: 3600`
- 成功返回字段：
  - `models`
- 说明：
  - 服务端会过滤掉没有 `id` 或 `name` 的模型
  - 并按 `name` 排序
- 失败返回：
  - `500`
  - 同时返回空数组 `models: []`

## 7. Webhooks

### `POST /api/webhooks/github`

- 鉴权：Webhook 签名
- 作用：接收 GitHub Webhook 事件；处理安装相关同步，并在符合条件时根据 GitHub App 已订阅并送达的仓库事件自动创建翻译任务
- 关键请求头：
  - `x-hub-signature-256`
  - `x-github-delivery`
  - `x-github-event`
- 请求体：GitHub Webhook 原始 JSON
- 主要逻辑：
  - 校验 HMAC-SHA256 签名
  - 防重：若 delivery 已处理过则直接返回
  - 记录 `webhook_events`
  - 处理 `installation` 和 `installation_repositories` 事件（这两个属于 GitHub App 默认送达事件，无需手动订阅）
  - 若 action 为 `created` / `added`，写入或更新 installation
  - 若 action 为 `deleted`，删除 installation
  - 对其他带 `repository` 上下文的事件，按仓库配置判断是否自动触发翻译
  - `push` 事件仅默认分支可触发
  - 仅当仓库已启用、已配置、`triggerMode === webhook` 且存在可用引擎时，自动创建 `translationTask`
  - 对同一 delivery 做幂等；若 payload 含 commit SHA，再按同一仓库同一 commit SHA 去重，避免重复入队
- 成功返回：

```json
{
  "success": true
}
```

- 可能返回：
  - `401` 缺少签名或签名无效
  - `400` 缺少 delivery ID
  - `500` Webhook Secret 未配置或服务端异常

### `GET /api/webhooks/github`

- 鉴权：公开
- 作用：Webhook 调试说明接口
- 成功返回字段：
  - `message`
  - `method`
  - `contentType`
  - `headers`

## 8. Debug

### `GET /api/debug/repositories`

- 鉴权：登录态
- 作用：调试当前用户的仓库、安装和配置落库情况
- 成功返回字段：
  - `user`
  - `repositories`
- 说明：偏开发排障使用，不建议在生产场景作为业务接口依赖

## 9. 主要数据结构速查

### Repository 列表项

常见字段：

```json
{
  "id": 123,
  "name": "repo",
  "full_name": "owner/repo",
  "description": "desc",
  "language": "TypeScript",
  "stargazers_count": 10,
  "private": false,
  "owner": {
    "login": "owner",
    "type": "User"
  },
  "isActive": true,
  "hasConfig": true,
  "dbId": "repo_db_id"
}
```

### TranslationTask

常见字段：

```json
{
  "id": "task_id",
  "repositoryId": "repo_id",
  "triggerType": "manual",
  "status": "pending",
  "totalFiles": 0,
  "processedFiles": 0,
  "failedFiles": 0,
  "totalTokens": 0,
  "errorMessage": null,
  "createdAt": "2026-03-13T00:00:00.000Z"
}
```

### TranslationConfig 保存体

```json
{
  "baseLanguage": "auto",
  "targetLanguages": ["zh", "ja"],
  "scopeMode": "preset_common_docs",
  "selectedFiles": [],
  "filePatterns": ["README*", "**/README*", "docs/**", "**/*.md", "**/*.mdx"],
  "excludePatterns": [],
  "triggerMode": "webhook",
  "engine": {
    "engineType": "openrouter",
    "apiKey": "or-xxx",
    "config": {
      "model": "openai/gpt-4o-mini",
      "temperature": 0.3
    },
    "isActive": true
  }
}
```

## 10. 备注

- 当前接口文档是按源码整理，不代表每个接口都已经对外稳定承诺。
- `GET /api/github-app/installations` 和 `POST /api/github-app/auto-sync` 读取 session 的方式与其他接口略有不同，后续如果要统一鉴权风格，可以优先收敛这两处。
- `GET /api/openrouter/models` 依赖外部网络，离线或第三方异常时会返回 `500` 和空模型数组。
- 当前本地下拉列表交互已统一为弹层式长列表选择器，支持键盘输入定位和打开时滚动到选中项；这属于前端交互改动，不影响接口协议本身。

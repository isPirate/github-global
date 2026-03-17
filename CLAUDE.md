# Claude AI 项目指引

## 项目概述
GitHub Global 是一个 GitHub 仓库自动化翻译平台，使用 AI 将仓库文档翻译成多语言，并自动创建分支和 Pull Request。

当前项目已完成一轮前端重构，重点页面已经统一到同一套 app shell 和视觉体系中。当前开发阶段以 Bug 修复、稳定性优化和交互细节打磨为主。

## 当前产品形态
- `/`：营销首页，直接引导 GitHub OAuth 登录
- `/dashboard`：总览页
- `/repositories`：仓库列表、同步、配置入口、快速翻译
- `/repositories/[id]/config`：仓库翻译配置页
- `/tasks`：任务列表、筛选、搜索、失败重试
- `/settings`：账户、GitHub App、OpenRouter Key、偏好设置

> 当前正常登录路径不再经过 `/login`。
> 首页 CTA 和受保护页面未登录跳转都直接进入 `/api/auth/signin`。

## 技术栈
- Next.js 15（App Router）+ TypeScript
- React 19
- Tailwind CSS + shadcn/ui
- MySQL + Prisma ORM
- GitHub OAuth（用户登录）
- GitHub App（仓库访问、Webhook、PR 操作）
- OpenRouter（翻译模型网关）
- p-queue（翻译任务队列）

## 核心架构

### 认证系统（双认证）
- GitHub OAuth：用户登录，核心在 `lib/auth/session.ts`
- GitHub App：仓库读写、Webhook、PR 操作

### 数据模型（10 个核心表）
```text
User -> UserSettings
  |
  v
GitHubAppInstallation -> Repository -> TranslationConfig
                                     -> TranslationEngine
                                     -> TranslationTask -> TranslationFile
                                                        -> TranslationHistory
WebhookEvent
```

### 关键目录
```text
app/
  api/                         Route Handlers
  dashboard/                   总览页
  repositories/                仓库页面
  tasks/                       任务页面
  settings/                    设置页面
  page.tsx                     营销首页

components/
  app-shell/                   顶部动作区、用户菜单等共享壳层组件
  dashboard/                   Dashboard 组件
  repository/                  仓库页组件
  tasks/                       任务页组件
  marketing/                   首页组件
  layout/                      PageShell、PageHeader 等页面骨架组件
  sidebar/                     侧边栏与用户信息

lib/
  auth/                        Session 管理
  crypto/                      密钥加密
  db/                          Prisma 客户端
  github/                      GitHub API 封装
  translation/                 翻译、队列、Markdown 处理

prisma/
  schema.prisma

docs/
  项目说明、设计方案、状态记录、接口文档
```

## 翻译工作流
1. 用户在仓库配置页设置基准语言、目标语言、翻译内容范围和翻译引擎。
2. 触发方式同时支持手动触发，以及 GitHub App 已订阅并送达的仓库事件自动触发。
3. 创建 `translationTask` 任务记录并压入 `p-queue`。
4. 发现匹配文件，做内容哈希去重。
5. 调用 OpenRouter 模型翻译 Markdown。
6. 生成目标分支并写入翻译结果。
7. 自动创建 PR，并把执行结果写入任务和文件历史。

## 当前开发重点
- 修复 UI 重构后的边界 Bug
- 提高页面刷新、轮询、搜索、表单回填的稳定性
- 优化 app shell、侧边栏、顶部操作区的一致性
- 继续收敛仓库配置页的大型客户端逻辑，推动“预设范围 + 手动选文件”的开箱即用配置体验
- 当前本地分支还包含一轮尚未推远程的 webhook 自动触发重构：统一改为 GitHub App 单 webhook、移除仓库级 webhook 遗留、支持按 GitHub App 已订阅并送达的仓库事件自动创建任务，排查相关问题时要优先参考本地代码而不是只看远程状态

## 重要约定
- GitHub App ID：`2890267`
- 数据库：MySQL `github_global`
- 纯本地开发建议使用 `http://localhost:3000`
- 若通过 ngrok 域名访问，`GITHUB_OAUTH_CALLBACK_URL` 必须与 GitHub OAuth App 后台配置完全一致
- 当前环境变量以 `APP_BASE_URL`、`GITHUB_APP_WEBHOOK_URL`、`GITHUB_APP_SLUG` 为准，不再使用旧的 `APP_URL`、`GITHUB_APP_NAME`、`NEXTAUTH_*`
- 当前仓库约定 `.env.local` 保存完整应用配置，根目录 `.env` 仅保留 `DATABASE_URL` 供 Prisma CLI 使用
- Webhook 必须验证签名
- OpenRouter API Key 必须加密存储

### Git 操作规则
- 禁止自动执行 Git 提交、推送、拉取等操作
- 只有在用户明确要求时才能执行 Git 操作
- 修改代码后可以询问是否需要提交，但不能自动提交

### 数据库变更规则
- 禁止使用 `npx prisma db push` 修改正式开发结构
- 必须使用 `npx prisma migrate dev --name <migration_name>` 生成 migration
- 所有数据库变更都必须有对应的 migration 文件
- 如果出现 `Drift detected`：
  1. 不要重置数据库
  2. 手动创建 migration 文件
  3. 使用 `npx prisma migrate resolve --applied <migration_name>` 标记状态

## 常用命令
```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:migrate
npm run db:studio
npx prisma migrate dev --name <name>
npx prisma migrate resolve --applied <name>
```

## 新会话建议先读
1. `CLAUDE.md`
2. `PROJECT_STATUS.md`
3. `prisma/schema.prisma`

## 按任务类型阅读

### 恢复项目上下文
- `PROJECT_STATUS.md`：当前进度、最近稳定性修复、页面结构
- `docs/API接口文档.md`：当前所有接口、鉴权方式、请求参数、返回结构
- `docs/2026-03-08-structure-review-and-lint-fix-change-log.md`：前一轮结构梳理和 lint 修复背景

### 添加或修改功能
- `docs/技术实现方案文档.md`：技术设计、模块边界、核心 API 方案
- `docs/需求规格文档.md`：产品需求、业务流程、用户场景

### 修改 API 或排查前后端联调
- `docs/API接口文档.md`
- `app/api/**/route.ts`
- 相关页面下的 client page 和调用组件
- 与用户偏好相关的逻辑还要检查 `app/api/user/settings/route.ts` 和仓库配置接口之间是否已接通

### 修改数据库
- `prisma/schema.prisma`
- `docs/技术实现方案文档.md` 中的数据库设计章节

### 修改翻译功能
- `lib/translation/`
- `app/api/repositories/[id]/translate/route.ts`
- `app/api/tasks/[id]/route.ts`

### 处理 GitHub App / Webhook
- `app/api/github-app/**/route.ts`
- `app/api/webhooks/github/route.ts`
- `docs/GitHub-App配置指南.md`

## 当前接口概况
- 路由文件数：24
- 接口路径数：24
- HTTP 方法总数：29
- 接口文档：`docs/API接口文档.md`

## 文档同步原则
- 修改登录流、页面结构、接口、数据库规则后，要同步检查：
  - `CLAUDE.md`
  - `PROJECT_STATUS.md`
  - `README.md`
  - `docs/API接口文档.md`（若接口有改动）
- 避免文档继续保留 `/login`、NextAuth、旧布局等过时描述

## 不需要优先阅读的文件
- `docs/OpenRouter-API配置指南.md`
- `docs/GitHub-App配置指南.md`
- 面向部署或接入的说明文档

## 额外提醒
- 仓库配置页、仓库列表页、任务列表页是当前最容易出现交互性 Bug 的区域。
- 当前部分接口的鉴权风格仍不完全统一，尤其是 GitHub App 相关接口，后续修改时要留意一致性。
- `GET /api/openrouter/models` 依赖外部网络，异常时会返回空模型数组和 500。
- 新仓库如果还没有仓库级配置，目标语言默认值来自用户偏好设置里的 `defaultTargetLanguages`。
- 仓库配置保存时，如果用户已在 Settings 配置全局 OpenRouter Key，仓库级 Key 可以留空；翻译执行时会优先尝试仓库级 Key，再回退到用户级 Key。
- OpenRouter 模型选择当前只使用接口实时返回的数据；如果历史配置里的模型 ID 不在最新列表中，页面会以自定义模型的形式继续显示，避免配置“消失”。

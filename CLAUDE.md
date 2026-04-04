# Claude AI 项目指引

## 项目概述

GitHub Global 是一个 GitHub 仓库自动化翻译平台，使用 AI 将仓库文档翻译成多语言，并通过 GitHub App 管理登录、仓库访问、Webhook 和 Pull Request 流程。

当前项目已经基本完成主流程闭环，现阶段重点是：

- 继续清理历史遗留字段与过时描述
- 提高配置页、仓库页、任务页的稳定性
- 收口文档体系，让现行文档与历史文档边界清晰

## 当前产品形态

- `/`：营销首页，直接引导 GitHub App 登录
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
- GitHub App user authorization（用户登录）
- GitHub App（仓库访问、Webhook、PR 操作）
- OpenRouter（翻译模型网关）
- p-queue（翻译任务队列）

## 核心架构

### 认证系统（双能力）

- GitHub App user authorization：用户登录，核心在 `lib/auth/session.ts`
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

### 当前配置模型重点

当前仓库配置的现行重点字段是：

- `baseLanguage`
- `targetLanguages`
- `watchedBranches`
- `scopeMode`
- `selectedFiles`
- `filePatterns`
- `excludePatterns`
- `triggerMode`
- `engine`

不再把已移除的模板类字段当作现行能力描述。

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
  项目说明、接口文档、接入指南、历史方案和计划记录
```

## 翻译工作流

1. 用户在仓库配置页设置基准语言、目标语言、翻译内容范围、监听分支和翻译引擎。
2. 触发方式同时支持手动触发，以及 GitHub App 已订阅并送达的仓库事件自动触发。
3. 留空监听分支时，自动回退到仓库默认分支。
4. 创建 `translationTask` 任务记录并压入 `p-queue`。
5. 发现匹配文件，做内容哈希去重。
6. 调用 OpenRouter 模型翻译 Markdown。
7. 按任务记录的源分支读取文件，并创建翻译分支与 PR。
8. 把执行结果写入任务、文件和历史记录。

## 当前开发重点

- 修复 UI 重构后的边界 Bug
- 提高页面刷新、轮询、搜索、表单回填的稳定性
- 继续收敛仓库配置页的大型客户端逻辑
- 提高 GitHub App 相关接口的一致性
- 持续同步文档，避免保留已删除字段、旧登录流或旧架构描述

## 文档分层

现行文档：

- `README.md`：外部入口，说明项目是什么、如何开始
- `docs/快速启动说明.md`：本地从 0 到可运行
- `PROJECT_STATUS.md`：当前状态与近期完成项
- `docs/API接口文档.md`：现行接口契约
- `docs/GitHub-App配置指南.md`：接通 GitHub App 的官方配置对照说明
- `docs/OpenRouter-API配置指南.md`：接通 OpenRouter 的官方配置对照说明

历史文档：

- `docs/需求规格文档.md`
- `docs/技术实现方案文档.md`
- `docs/plans/**`
- `docs/*change-log*.md`

> 历史文档保留背景价值，但不再默认代表当前实现。

## 重要约定

- GitHub App ID：`2890267`
- 数据库：MySQL `github_global`
- 纯本地开发建议使用 `http://localhost:3000`
- 若通过 ngrok 域名访问，`GITHUB_APP_USER_CALLBACK_URL` 必须与 GitHub App 后台配置完全一致
- 当前环境变量以 `APP_BASE_URL`、`GITHUB_APP_WEBHOOK_URL`、`GITHUB_APP_SLUG` 为准，不再使用旧的 `APP_URL`、`GITHUB_APP_NAME`、`NEXTAUTH_*`
- 当前仓库约定 `.env.local` 保存完整应用配置，根目录 `.env` 仅保留 `DATABASE_URL` 供 Prisma CLI 使用
- 核实中文文档、注释或 schema 是否乱码时，必须先使用 UTF-8 显式读取文件内容再判断；不要仅凭终端默认编码下的显示结果认定文件本身存在乱码
- Webhook 必须验证签名
- OpenRouter API Key 必须加密存储

### Git 操作规则

- 禁止自动执行 Git 提交、推送、拉取等操作
- 只有在用户明确要求时才能执行 Git 操作
- 修改代码后可以询问是否需要提交，但不能自动提交
- Git 提交信息使用 Conventional Commits 规范，例如 `fix:`、`refactor:`、`docs:`、`feat:` 等
- Git 提交信息中的类型使用英文，描述使用简洁中文，优先准确概括本次变更的用户价值或技术目的

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

- `PROJECT_STATUS.md`：当前进度、最近完成项、现行边界
- `docs/API接口文档.md`：当前所有接口、鉴权方式、请求参数、返回结构
- `prisma/schema.prisma`：当前数据库结构

### 添加或修改功能

- 当前仓库代码实现
- `docs/API接口文档.md`
- `PROJECT_STATUS.md`
- `docs/需求规格文档.md`：仅作历史需求背景参考
- `docs/技术实现方案文档.md`：仅作历史设计背景参考

### 修改 API 或排查前后端联调

- `docs/API接口文档.md`
- `app/api/**/route.ts`
- 相关页面下的 client page 和调用组件
- `app/api/user/settings/route.ts` 与仓库配置接口之间的接通情况

### 修改数据库

- `prisma/schema.prisma`
- 最新 migration 文件
- 历史方案文档只作背景参考，不作为当前结构真相

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
  - `docs/快速启动说明.md`
  - `docs/API接口文档.md`（若接口有改动）
- 指导性文档中的第三方配置必须优先依据最新官方文档核验
- 避免文档继续保留 `/login`、NextAuth、旧布局、已删除字段等过时描述

## 不需要优先阅读的文件

- 历史计划文档
- 历史变更记录文档
- 面向部署或接入的专项说明文档

## 额外提醒

- 仓库配置页、仓库列表页、任务列表页是当前最容易出现交互性 Bug 的区域
- 当前部分接口的鉴权风格仍不完全统一，尤其是 GitHub App 相关接口
- `GET /api/openrouter/models` 依赖外部网络，异常时会返回空模型数组和 500
- 新仓库如果还没有仓库级配置，目标语言默认值来自用户偏好设置里的 `defaultTargetLanguages`
- 仓库配置保存时，如果用户已在 Settings 配置全局 OpenRouter Key，仓库级 Key 可以留空；翻译执行时会优先尝试仓库级 Key，再回退到用户级 Key
- 仓库配置中的监听分支留空时，Webhook 自动触发、手动翻译和配置页文件列表都会回退到仓库默认分支；若填写多个分支，手动翻译默认优先使用第一条分支
- OpenRouter 模型选择当前只使用接口实时返回的数据；如果历史配置里的模型 ID 不在最新列表中，页面会以自定义模型的形式继续显示，避免配置“消失”

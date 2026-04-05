# GitHub Global

自动化翻译 GitHub 仓库文档，并通过 GitHub App 管理登录、仓库授权、Webhook 与 Pull Request 流程。

GitHub Global 是一个面向开源项目维护者和文档团队的 GitHub 文档翻译平台。它围绕 GitHub App、OpenRouter、Prisma 和 Next.js 构建，目标是把"配置翻译规则、执行翻译、追踪任务、回写 PR"收敛成一条可重复的工作流。

## 界面预览

<table>
  <tr>
    <td align="center"><b>营销首页</b></td>
    <td align="center"><b>仓库列表</b></td>
  </tr>
  <tr>
    <td><img src="docs/images/homepage.png" alt="营销首页" width="480" /></td>
    <td><img src="docs/images/repositories.png" alt="仓库列表" width="480" /></td>
  </tr>
  <tr>
    <td align="center"><b>仓库配置</b></td>
    <td align="center"><b>翻译任务</b></td>
  </tr>
  <tr>
    <td><img src="docs/images/repository-config.png" alt="仓库配置页" width="480" /></td>
    <td><img src="docs/images/tasks.png" alt="翻译任务列表" width="480" /></td>
  </tr>
</table>

## 功能特性

- **GitHub App 登录** — 基于 GitHub App user authorization 的用户认证
- **仓库管理** — 安装 GitHub App 后自动同步授权仓库，支持启用/禁用/搜索
- **翻译配置** — 目标语言、翻译范围（预设/手动选文件/高级规则）、监听分支、模型选择
- **翻译执行** — 手动触发或 Webhook 自动触发，通过 OpenRouter 调用翻译模型
- **任务追踪** — 任务列表、状态筛选、失败重试、文件级详情与 PR 链接
- **PR 回写** — 自动创建翻译分支并提交 Pull Request，翻译结果直接回到仓库
- **用户级 Key 回退** — 仓库级 OpenRouter Key 留空时自动回退到用户全局 Key

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
copy .env.example .env.local
```

根目录 `.env` 仅保留 Prisma CLI 需要的数据库连接，与 `.env.local` 中的 `DATABASE_URL` 和 `DIRECT_URL` 保持一致：

```env
DATABASE_URL="postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

`.env.local` 至少需要配置：

```env
DATABASE_URL="postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
ENCRYPTION_KEY="your-64-char-hex-key"

GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_CLIENT_ID="Iv1.1234567890abcdef"
GITHUB_APP_CLIENT_SECRET="your_github_app_client_secret"
GITHUB_APP_USER_CALLBACK_URL="http://localhost:3000/api/auth/callback"
GITHUB_APP_SLUG="your_github_app_slug"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET="your_webhook_secret"

APP_BASE_URL="http://localhost:3000"
GITHUB_APP_WEBHOOK_URL="https://your-public-domain.example.com/api/webhooks/github"
QUEUE_CONCURRENCY=5
```

如果你暂时只验证登录、仓库同步和手动翻译，Webhook 可以稍后再接；但一旦启用 GitHub 事件自动触发，`GITHUB_APP_WEBHOOK_URL` 必须使用公网可访问地址。

### 3. 初始化数据库

```bash
npm run db:generate
npx prisma db push
```

### 4. 启动开发服务

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

更完整的本地启动与排障说明见 [docs/快速启动说明.md](docs/快速启动说明.md)。

## 使用流程

1. 打开首页 `/`，点击"使用 GitHub 登录"
2. 在仓库页安装 GitHub App 并同步仓库权限
3. 进入仓库配置页设置目标语言、翻译范围、监听分支和模型
4. 手动触发翻译，或等待 Webhook 事件自动创建任务
5. 在 `/tasks` 查看翻译结果、失败原因和 PR 链接

> 自动触发依赖 GitHub App Webhook；如果你只是本地联调登录、仓库同步和手动翻译，可以暂时不配置 Webhook。

## 技术栈

- Next.js 15 App Router
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + Supabase PostgreSQL
- GitHub App user authorization + GitHub App installations
- OpenRouter
- p-queue

## 文档导航

| 文档 | 作用 |
|------|------|
| [docs/快速启动说明.md](docs/快速启动说明.md) | 本地从 0 到可运行的开发启动指南 |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | 当前版本状态、近期完成项与待优化项 |
| [docs/API接口文档.md](docs/API接口文档.md) | 现行接口契约与请求/返回结构 |
| [docs/GitHub-App配置指南.md](docs/GitHub-App配置指南.md) | 按 GitHub 官方最新后台配置项接通 GitHub App |
| [docs/OpenRouter-API配置指南.md](docs/OpenRouter-API配置指南.md) | 获取与配置 OpenRouter Key、模型与验证方式 |
| [CLAUDE.md](CLAUDE.md) | 协作约定、当前实现概况和文档同步规则 |
| [docs/需求规格文档.md](docs/需求规格文档.md) | 历史 PRD，保留产品背景与初始目标 |
| [docs/技术实现方案文档.md](docs/技术实现方案文档.md) | 历史技术方案，保留早期架构设计背景 |

## 开发与安全说明

- 根目录 `.env` 仅保留 `DATABASE_URL`，供 Prisma CLI 使用
- 完整运行时配置维护在 `.env.local`
- 数据库使用 Supabase 托管 PostgreSQL，schema 变更通过 `npx prisma db push` 同步
- 本地开发建议统一使用 `http://localhost:3000`，不要混用 `127.0.0.1`
- 不要提交 `.env`、`.env.local`、私钥文件或任何真实 Secret
- GitHub App 的用户授权回调地址必须与 `GITHUB_APP_USER_CALLBACK_URL` 以及 GitHub App 后台配置一致

# GitHub Global

> 自动化翻译 GitHub 仓库文档，并统一管理仓库、任务和配置。

GitHub Global 是一个基于 Next.js 的 GitHub 仓库自动化翻译平台。当前实现采用：

- GitHub OAuth 进行用户登录
- GitHub App 进行仓库访问和 PR 操作
- OpenRouter 作为翻译模型网关
- Prisma + MySQL 存储用户、仓库、任务和配置数据

## 当前产品形态

- 首页：营销落地页，登录入口直接跳转 GitHub OAuth
- Dashboard：登录后总览页
- Repositories：仓库列表、同步、配置、快速翻译
- Tasks：任务列表、状态筛选、搜索、失败重试
- Settings：账户、GitHub App、OpenRouter Key、偏好设置

> 当前正常登录路径不再经过 `/login` 页面。
> 请直接从首页 CTA 或 `/api/auth/signin` 进入 GitHub OAuth。

## 核心能力

- GitHub OAuth 登录
- GitHub App 安装与仓库同步
- 仓库级翻译配置
- 预设范围 + 手动选文件的内容筛选
- OpenRouter 翻译引擎
- Markdown 文档翻译
- 翻译任务追踪
- 自动创建 Pull Request
- 用户级 OpenRouter API Key 加密存储

## 技术栈

### 前端
- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

### 后端
- Next.js Route Handlers
- Prisma ORM
- MySQL

### 集成
- GitHub OAuth
- GitHub App
- OpenRouter
- p-queue

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example`：

```bash
copy .env.example .env.local
copy .env.local .env
```

至少需要配置这些项：

```env
DATABASE_URL="mysql://root:password@localhost:3306/github_global"
ENCRYPTION_KEY="your-64-char-hex-key"

GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"
GITHUB_OAUTH_CALLBACK_URL="http://localhost:3000/api/auth/callback"

GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_NAME="your_github_app_name"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET="your_webhook_secret"

APP_URL="http://localhost:3000"
APP_NAME="GitHub Global"
QUEUE_CONCURRENCY=5
```

### 3. 初始化数据库

```bash
npm run db:generate
npm run db:migrate
```

> 按当前仓库约定，数据库结构变更统一使用 Prisma Migration，不使用 `db push` 修改正式开发结构。

### 4. 启动开发服务

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

> 本地开发请统一使用 `localhost`，不要混用 `127.0.0.1`。

## 登录与使用流程

1. 打开首页 `/`
2. 点击“使用 GitHub 登录”
3. 完成 GitHub OAuth 授权
4. 系统跳转到 `/dashboard`
5. 在仓库页安装并同步 GitHub App 仓库权限
6. 配置翻译规则并发起翻译任务

## 重要文档

- [快速启动说明](./docs/快速启动说明.md)
- [接口文档](./docs/API接口文档.md)
- [GitHub App 配置指南](./docs/GitHub-App配置指南.md)
- [OpenRouter API 配置指南](./docs/OpenRouter-API配置指南.md)

## 项目结构

```text
app/
  api/                  Route Handlers
  dashboard/            总览页
  repositories/         仓库页面
  tasks/                任务页面
  settings/             设置页面
  page.tsx              首页
components/
  dashboard/            Dashboard 组件
  repository/           仓库页面组件
  tasks/                任务页面组件
  marketing/            首页组件
  layout/               页面骨架组件
lib/
  auth/                 Session 管理
  github/               GitHub API 封装
  translation/          翻译与队列逻辑
  db/                   Prisma 客户端
prisma/
  schema.prisma
docs/
  各类配置与说明文档
```

## 开发命令

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
```

## 安全说明

- 不要把 `.env`、`.env.local`、私钥文件提交到仓库
- 不要把真实 Client Secret、Webhook Secret、数据库密码写入文档
- 本地开发和 OAuth 回调请统一使用 `http://localhost:3000`

## 当前状态

当前代码已完成一轮前端重构，登录、仓库、任务、设置和营销首页都已经统一到同一套界面结构中。仓库配置页目前已简化为更偏开箱即用的流程：默认源语言自动识别、目标语言支持全球搜索多选、翻译范围支持预设选择与手动勾选文件，自定义模型 ID 也已回到模型选择区域内联填写。任务页的自动刷新提示现已覆盖 pending 和 processing 任务，翻译任务自动创建的 PR 标题与正文乱码也已修正。

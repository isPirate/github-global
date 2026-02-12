# GitHub Global

> 自动化翻译您的 GitHub 仓库文档，打破语言壁垒

GitHub Global 是一个 SaaS 平台，帮助开源项目作者自动化翻译仓库文档，支持多种语言和翻译引擎。

## ✨ 核心功能

- 🔐 **GitHub OAuth 登录** - 安全便捷的身份验证
- 🔗 **GitHub App 集成** - 细粒度权限控制，独立 Bot 模式
- 🌍 **多语言翻译** - 支持 195+ 语言（ISO 639-1）
- 🤖 **多引擎支持** - OpenRouter 统一网关，支持 100+ AI 模型
- 📝 **Markdown 保留** - 智能保留代码块、链接、图片
- 🔄 **自动同步** - Webhook 监听，自动翻译变更内容
- 🎯 **Pull Request** - 翻译结果以 PR 形式提交，保持仓库整洁
- 📊 **历史记录** - 完整的翻译历史和状态追踪

## 🛠️ 技术栈

### 前端
- **Next.js** 15.1.11 - React 全栈框架
- **React** 19.x - UI 库
- **TypeScript** 5.x - 类型安全
- **TailwindCSS** 3.x - 样式框架
- **shadcn/ui** - 高质量组件库

### 后端
- **Next.js API Routes** - 服务端 API
- **Prisma ORM** - 数据库 ORM
- **MySQL** 8.0+ - 关系型数据库

### 集成服务
- **GitHub App** - 仓库操作和 Webhook
- **NextAuth.js** - GitHub OAuth 认证
- **OpenRouter** - 统一 LLM 网关
- **p-queue** - 本地队列管理

## 📋 前置要求

- **Node.js** 20.x+
- **MySQL** 8.0+
- **GitHub App** - 用于仓库操作
- **OpenRouter API Key** - 用于翻译功能

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`：

```bash
copy .env.example .env.local
```

编辑 `.env.local`，填入配置：

```bash
# 数据库
DATABASE_URL="mysql://root:password@localhost:3306/github_global"

# 加密密钥（运行生成命令）
ENCRYPTION_KEY="your-64-char-hex-key"

# GitHub OAuth
GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"
GITHUB_OAUTH_CALLBACK_URL="http://localhost:3000/api/auth/callback"

# GitHub App
GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_NAME="your_github_app_name"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET="your_webhook_secret"

# NextAuth
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# 应用配置
APP_URL="http://localhost:3000"
APP_NAME="GitHub Global"

# 队列配置
QUEUE_CONCURRENCY=5
```

### 3. 创建数据库

```sql
CREATE DATABASE github_global;
```

### 4. 运行数据库迁移

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📖 配置指南

详细的配置步骤请参考以下文档：

- **[快速启动说明](./docs/快速启动说明.md)** - 详细的安装和配置步骤
- **[GitHub App 配置指南](./docs/GitHub-App配置指南.md)** - 如何创建和配置 GitHub App
- **[OpenRouter API 配置指南](./docs/OpenRouter-API配置指南.md)** - 如何配置翻译引擎

## 📁 项目结构

```
github-global/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面
│   ├── (dashboard)/       # Dashboard 页面
│   ├── api/               # API Routes
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   └── ui/                # shadcn/ui 组件
├── lib/                   # 核心业务逻辑
│   ├── auth/              # 认证模块
│   ├── github/            # GitHub API 封装
│   ├── translation/       # 翻译引擎
│   ├── crypto/            # 加密服务
│   └── db/                # 数据库客户端
├── prisma/                # 数据库 Schema
│   └── schema.prisma
├── docs/                  # 文档
└── middleware.ts          # Next.js 中间件
```

## 🔑 核心模块

### 认证系统 (`lib/auth/`)
- **session.ts** - Session 管理
- **github-oauth.ts** - GitHub OAuth 封装

### GitHub 集成 (`lib/github/`)
- **app.ts** - GitHub App 管理（JWT、安装）
- **client.ts** - GitHub API 客户端
- **webhook.ts** - Webhook 处理
- **types.ts** - GitHub 类型定义

### 翻译引擎 (`lib/translation/`)
- **openrouter.ts** - OpenRouter 引擎实现
- **markdown.ts** - Markdown 结构保留翻译
- **queue.ts** - 翻译队列管理（p-queue）

### 加密服务 (`lib/crypto/`)
- **encryption.ts** - AES-256-GCM 加密/解密

## 🗄️ 数据库 Schema

项目使用 Prisma ORM 管理数据库，主要数据表：

- **users** - 用户表
- **github_app_installations** - GitHub App 安装记录
- **repositories** - 仓库表
- **translation_configs** - 翻译配置
- **translation_engines** - 翻译引擎配置
- **translation_tasks** - 翻译任务
- **translation_files** - 文件翻译记录
- **translation_history** - 翻译历史
- **webhook_events** - Webhook 事件日志

## 📝 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行数据库迁移
npm run db:migrate

# 推送 schema 到数据库
npm run db:push

# 打开 Prisma Studio
npm run db:studio

# 代码检查
npm run lint
```

## 🔒 安全特性

- ✅ API Key AES-256-GCM 加密存储
- ✅ Webhook HMAC-SHA256 签名验证
- ✅ GitHub App 短期 Token（1 小时自动刷新）
- ✅ Session 安全管理
- ✅ SQL 注入防护（Prisma ORM）
- ✅ 用户权限隔离

## 🌟 MVP 功能范围

### ✅ 已实现
- 用户认证（GitHub OAuth）
- GitHub App 集成
- 仓库管理
- 翻译配置
- 翻译执行（OpenRouter + Markdown 保留）
- Webhook 监听
- Pull Request 创建
- 历史记录

### 🚧 后续扩展
- 实时通知（Socket.IO）
- 分布式队列（BullMQ + Redis）
- 定时任务（Cron）
- 邮件通知
- 翻译记忆库
- 翻译质量评分

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题或建议，请：
- 提交 GitHub Issue
- 查阅项目文档
- 联系维护者

---

**Made with ❤️ by Claude Code**

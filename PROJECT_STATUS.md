# GitHub Global - 项目状态和使用说明

## ✅ 项目状态

**当前版本：v2.0** - 翻译核心功能已完成

### 已完成的功能

#### 1. 用户认证 ✅
- GitHub OAuth 登录
- 用户会话管理
- 安全的 session 存储
- 自动登录状态检查
- 获取当前用户信息 API

#### 2. 数据库 ✅
- MySQL 数据库配置
- Prisma ORM 集成
- 完整的数据模型（9个核心表）
- 数据库迁移支持

**数据模型列表：**
- `User` - 用户信息
- `GitHubAppInstallation` - GitHub App 安装记录
- `Repository` - 仓库信息
- `TranslationConfig` - 翻译配置
- `TranslationEngine` - 翻译引擎配置
- `TranslationTask` - 翻译任务
- `TranslationFile` - 文件翻译记录
- `TranslationHistory` - 翻译历史
- `WebhookEvent` - Webhook 事件日志

#### 3. GitHub App 集成 ✅
- GitHub App 安装检测（实时）
- 自动同步安装和仓库
- 仓库权限管理（通过GitHub页面）
- Webhook 事件处理

#### 4. 仓库管理 ✅
- 仓库列表展示
- 自动同步已授权仓库
- 仓库配置页面
- 仓库启用/禁用
- 手动触发翻译
- 翻译历史查询
- 实时检测安装状态变化

#### 5. 翻译功能 ✅
- **多引擎支持**：OpenRouter 翻译引擎
- **文件发现**：自动化文件发现和 glob 模式匹配
- **多语言翻译**：支持多目标语言翻译
- **分支管理**：自动创建独立语言分支
- **PR 自动创建**：自动创建 Pull Request
- **任务队列**：使用 p-queue 管理并发翻译任务
- **进度跟踪**：完整的翻译进度跟踪
- **错误处理**：自动降级和错误处理
- **Markdown 支持**：专门优化的 Markdown 文件翻译
- **内容哈希**：文件内容哈希检查避免重复翻译
- **加密存储**：API 密钥加密存储
- **Webhook 触发**：GitHub webhook 自动触发翻译

#### 6. 核心页面 ✅
- 首页 (`/`)
- 登录页 (`/login`)
- Dashboard (`/dashboard`)
- 仓库管理页 (`/repositories`)
- 仓库配置页 (`/repositories/[id]/config`)
- 任务页 (`/tasks`)
- 设置页 (`/settings`)

#### 7. API 端点 ✅

**认证相关：**
- `POST /api/auth/signin` - GitHub OAuth 登录
- `GET /api/auth/callback` - OAuth 回调处理
- `POST /api/auth/signout` - 退出登录
- `GET /api/auth/me` - 获取当前用户信息

**GitHub App 相关：**
- `GET /api/github-app/install-link` - 获取安装链接
- `GET /api/github-app/installation-url` - 获取安装 URL
- `GET /api/github-app/installations` - 获取安装列表
- `POST /api/github-app/auto-sync` - 自动同步安装
- `GET /api/github-app/sync` - 手动同步

**仓库管理：**
- `GET /api/repositories` - 获取所有仓库（自动同步）
- `POST /api/repositories/add` - 添加仓库
- `GET /api/debug/repositories` - 调试仓库信息
- `POST /api/repositories/[id]/config` - 更新仓库配置
- `POST /api/repositories/[id]/enable` - 启用仓库
- `POST /api/repositories/[id]/disable` - 禁用仓库
- `POST /api/repositories/[id]/translate` - 手动触发翻译
- `GET /api/repositories/[id]/translations` - 获取翻译历史

**翻译任务：**
- `GET /api/tasks` - 获取所有任务
- `GET /api/tasks/[id]` - 获取特定任务详情

**Webhook：**
- `POST /api/webhooks/github` - GitHub Webhook 处理

### 待优化的功能

- [ ] 设置页面的完整实现
- [ ] 任务状态的实时更新界面
- [ ] 翻译结果预览功能
- [ ] 更丰富的 UI 组件库

## 🚀 快速开始

### 1. 环境要求

- **Node.js**: v18.0.0 或更高版本
- **MySQL**: v8.0 或更高版本
- **npm**: v9.0.0 或更高版本

### 2. 数据库配置

启动 MySQL 服务：
```bash
# Windows
# 任务管理器 -> 服务 -> MySQL80 -> 启动
```

数据库会自动创建。确保配置信息：
- Host: localhost
- Port: 3306
- User: root
- Password: root
- Database: github_global

### 3. 环境变量

项目已配置完成以下环境变量（在 `.env.local` 文件中）：

```env
# GitHub OAuth（用于用户登录）
GITHUB_CLIENT_ID=Ov23lipmzurvTNIbN06U
GITHUB_CLIENT_SECRET=ba911c3bfa922314babcfafa14fd7aa247822c01
GITHUB_OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/callback

# GitHub App（用于仓库操作）
GITHUB_APP_ID=2890267
GITHUB_APP_NAME=translate-github-logbal
GITHUB_APP_PRIVATE_KEY=<private_key_content>
GITHUB_APP_WEBHOOK_SECRET=<webhook_secret>

# 数据库
DATABASE_URL=mysql://root:root@localhost:3306/github_global

# NextAuth
NEXTAUTH_SECRET=pHhOVNb4iqwZ7ZOQylVThxW1EpaOQgFvHQahTdw5Ehc=
NEXTAUTH_URL=http://localhost:3000

# 应用配置
APP_URL=http://localhost:3000
APP_NAME=GitHub Global
```

### 4. 启动项目

```bash
# 安装依赖（如果还未安装）
npm install

# 同步数据库
npx prisma db push

# 启动开发服务器
npm run dev
```

项目将在 `http://localhost:3000` 启动

### 5. 使用流程

#### 新用户流程：

1. 访问首页：`http://localhost:3000`
2. 点击"开始使用"
3. 点击"使用 GitHub 登录"
4. 在 GitHub 授权页面点击"Authorize"
5. 自动跳转到 Dashboard

#### 仓库管理流程：

1. 在 Dashboard 点击"我的仓库"
2. 如果未安装 GitHub App，点击"安装 GitHub App"
3. 在 GitHub 页面选择要授权的仓库
4. 返回并点击"已安装？点击同步"或"刷新"
5. 仓库自动出现在列表中
6. 点击"配置翻译"设置翻译规则

#### 添加新仓库：

1. 点击"管理仓库权限"按钮
2. 在 GitHub 页面添加新的仓库权限
3. 返回并点击"刷新"
4. 新仓库自动同步到列表

## 📁 项目结构

```
github-global/
├── app/
│   ├── (auth)/
│   │   └── login/              # 登录页面
│   ├── api/
│   │   ├── auth/               # 认证 API
│   │   │   ├── callback/       # OAuth 回调
│   │   │   ├── signin/         # 登录请求
│   │   │   ├── signout/        # 退出登录
│   │   │   └── me/             # 获取用户信息
│   │   ├── github-app/         # GitHub App API
│   │   │   ├── install-link/   # 安装链接
│   │   │   ├── installation-url/ # 安装 URL
│   │   │   ├── installations/  # 安装列表
│   │   │   ├── auto-sync/      # 自动同步
│   │   │   └── sync/           # 手动同步
│   │   ├── repositories/       # 仓库管理 API
│   │   │   ├── route.ts        # 获取仓库列表
│   │   │   ├── add/            # 添加仓库
│   │   │   ├── [id]/           # 仓库详情操作
│   │   │   │   ├── config/     # 更新配置
│   │   │   │   ├── enable/     # 启用仓库
│   │   │   │   ├── disable/    # 禁用仓库
│   │   │   │   ├── translate/  # 触发翻译
│   │   │   │   └── translations/ # 翻译历史
│   │   │   └── debug/          # 调试接口
│   │   ├── tasks/              # 翻译任务 API
│   │   │   ├── route.ts        # 获取任务列表
│   │   │   └── [id]/           # 任务详情
│   │   └── webhooks/           # Webhook 处理
│   │       └── github/         # GitHub Webhooks
│   ├── dashboard/              # Dashboard
│   ├── repositories/           # 仓库管理页面
│   │   └── [id]/
│   │       └── config/         # 仓库配置页面
│   ├── tasks/                  # 翻译任务页面
│   ├── settings/               # 设置页面
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # 首页
├── components/
│   └── ui/                     # UI 组件
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── alert.tsx
├── lib/
│   ├── auth/
│   │   └── session.ts          # 会话管理
│   ├── crypto/
│   │   └── encryption.ts       # 密钥加密
│   ├── db/
│   │   └── prisma.ts           # Prisma 客户端
│   ├── github/
│   │   ├── app.ts              # GitHub App 客户端
│   │   ├── client.ts           # GitHub API 客户端
│   │   ├── types.ts            # GitHub 类型定义
│   │   └── fetch.ts            # GitHub 数据获取
│   ├── translation/
│   │   ├── openrouter.ts       # OpenRouter 翻译引擎
│   │   ├── markdown.ts         # Markdown 处理
│   │   └── queue.ts            # 翻译任务队列
│   ├── fetch.ts                # Fetch 工具
│   └── utils.ts                # 工具函数
├── prisma/
│   ├── schema.prisma           # 数据库模型
│   └── migrations/             # 数据库迁移
├── middleware.ts               # Next.js 中间件
└── .env.local                  # 环境变量配置
```

## 🔧 可用的 npm 脚本

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 数据库
npx prisma db push   # 同步数据库到 schema
npx prisma studio    # 打开 Prisma Studio（数据库管理界面）
npx prisma generate  # 生成 Prisma Client

# 代码质量
npm run lint         # 代码检查
```

## 🎯 核心功能说明

### 仓库自动同步机制

系统实现了智能的仓库自动同步：

1. **实时检测**：每次访问仓库页面时，从 GitHub API 获取最新的安装状态
2. **自动创建**：GitHub 上有但数据库中没有的仓库，自动创建记录
3. **自动清理**：数据库中有但 GitHub 上没有的仓库，自动删除记录
4. **权限管理**：仓库添加/删除权限通过 GitHub 页面管理

### 翻译工作流程

1. **配置翻译**：在仓库配置页面设置目标语言、文件模式等
2. **触发翻译**：
   - 手动触发：点击"立即翻译"按钮
   - 自动触发：GitHub Webhook 监听 push 事件
3. **任务队列**：翻译任务进入队列，使用 p-queue 管理并发
4. **文件处理**：
   - 发现匹配的文件（glob 模式）
   - 检查内容哈希避免重复翻译
   - 调用翻译引擎进行翻译
5. **分支创建**：为目标语言创建独立分支
6. **PR 创建**：自动创建 Pull Request 到目标仓库
7. **进度跟踪**：实时更新翻译进度和状态

### 翻译引擎设计

支持 OpenRouter 多模型翻译：

- **模型自动降级**：主模型失败时自动切换备用模型
- **并发控制**：队列管理避免 API 速率限制
- **Token 统计**：精确跟踪 Token 使用量
- **Markdown 优化**：专门处理 Markdown 格式，保留代码块和链接

### GitHub App 与 OAuth 的区别

- **GitHub OAuth**：用于用户登录认证
- **GitHub App**：用于仓库操作和翻译功能
  - 需要单独安装
  - 可以访问用户选择的仓库
  - 使用 JWT 认证
  - 支持实时权限管理
  - 接收 Webhook 事件

### 数据库设计

9 个核心表结构：

- **User** - 用户信息
- **GitHubAppInstallation** - GitHub App 安装记录
- **Repository** - 仓库信息
- **TranslationConfig** - 翻译配置（目标语言、文件模式等）
- **TranslationEngine** - 翻译引擎配置（API 密钥加密存储）
- **TranslationTask** - 翻译任务（状态、进度、统计）
- **TranslationFile** - 文件翻译记录（状态、哈希、Token）
- **TranslationHistory** - 翻译历史事件
- **WebhookEvent** - Webhook 事件日志

## 🐛 故障排除

### 问题 1：数据库连接失败

```bash
# 检查 MySQL 服务状态
# Windows: 任务管理器 -> 服务 -> MySQL80

# 测试连接
mysql -u root -p
# 输入密码: root
```

### 问题 2：GitHub OAuth 登录失败

检查 GitHub OAuth 应用配置：
1. 访问 https://github.com/settings/developers
2. 检查 OAuth App 的 Authorization callback URL
3. 应该是：`http://localhost:3000/api/auth/callback`

### 问题 3：GitHub App 安装后仓库不显示

1. 点击页面上的"刷新"按钮
2. 或点击"已安装？点击同步"按钮
3. 确保在 GitHub App 安装时选择了仓库

### 问题 4：仓库显示为空

可能的原因：
- GitHub App 未安装
- 安装时未选择任何仓库
- 权限设置问题

解决方法：
1. 点击"安装 GitHub App"
2. 在 GitHub 页面选择"All repositories"或特定仓库
3. 返回并同步

### 问题 5：端口被占用

如果 3000 端口被占用：

```bash
# Windows - 查找占用进程
netstat -ano | findstr :3000

# 终止进程（将 PID 替换为实际 ID）
taskkill /PID <PID> /F
```

## 🔐 安全注意事项

1. **环境变量**：
   - `.env.local` 文件包含敏感信息
   - 不要提交到 Git 仓库
   - 已在 `.gitignore` 中排除

2. **GitHub 凭据**：
   - Client Secret 应该保密
   - Private Key 文件应该安全存储
   - 生产环境使用不同的凭据

3. **Session 安全**：
   - Session cookie 使用 httpOnly
   - 考虑启用 secure flag（HTTPS）

4. **GitHub App 安全**：
   - Webhook Secret 用于验证 webhook 请求
   - JWT 用于服务器端认证
   - 不暴露 Private Key

## 📊 API 端点

### 认证相关
- `GET /api/auth/signin` - 启动 OAuth 流程
- `GET /api/auth/callback` - OAuth 回调
- `POST /api/auth/signout` - 退出登录

### GitHub App 相关
- `GET /api/github-app/install-link` - 获取 GitHub App 安装链接
- `POST /api/github-app/auto-sync` - 手动同步安装状态

### 仓库管理
- `GET /api/repositories` - 获取用户的仓库列表（自动同步）
- `POST /api/repositories/add` - 添加仓库（已废弃，使用自动同步）
- `DELETE /api/repositories/[id]` - 删除仓库（已废弃，使用自动同步）

### Webhook
- `POST /api/webhooks/github` - 处理 GitHub Webhook 事件

## 🎯 下一步开发

### 已完成 ✅
1. ✅ 实现仓库列表页面
2. ✅ 添加 GitHub App 集成
3. ✅ 实现翻译配置界面
4. ✅ 实现翻译任务创建和管理
5. ✅ 集成 AI 翻译 API (OpenRouter)
6. ✅ Webhook 处理 push 事件
7. ✅ 自动创建 Pull Request
8. ✅ 翻译进度追踪
9. ✅ 翻译历史记录
10. ✅ 多语言支持

### 可优化功能 🔄
1. 设置页面的完整实现
2. 任务状态的实时更新界面（WebSocket/SSE）
3. 翻译结果预览功能
4. 翻译质量评估机制
5. 更多文件格式支持（.mdx, .txt 等）
6. 批量翻译操作
7. 翻译记忆库（TM）集成
8. 术语表管理

### 未来功能 🚀
1. 翻译版本对比
2. 自动翻译规则建议
3. 翻译成本估算
4. 多翻译引擎支持（DeepL, Google 等）
5. 翻译质量评分
6. 协作翻译功能
7. 翻译审核流程

## 📝 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **数据库**: MySQL + Prisma ORM
- **样式**: Tailwind CSS
- **认证**: 自定义 OAuth 实现
- **GitHub 集成**: Octokit + GitHub App
- **部署**: Vercel（推荐）

## 📞 支持

如遇问题，请检查：
1. 服务器日志：控制台输出
2. 浏览器控制台：前端错误
3. 数据库状态：`npx prisma studio`
4. GitHub App 设置：https://github.com/settings/apps

---

**最后更新**: 2026-02-27
**版本**: 2.0.0
**状态**: ✅ 翻译核心功能已完成

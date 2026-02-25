# GitHub Global - 项目状态和使用说明

## ✅ 项目状态

**当前版本：v1.0** - 可用状态

### 已完成的功能

#### 1. 用户认证 ✅
- GitHub OAuth 登录
- 用户会话管理
- 安全的 session 存储
- 自动登录状态检查

#### 2. 数据库 ✅
- MySQL 数据库配置
- Prisma ORM 集成
- 用户数据持久化
- 数据库迁移支持

#### 3. 核心页面 ✅
- 首页 (`/`)
- 登录页 (`/login`)
- Dashboard (`/dashboard`)
- 错误处理和显示

#### 4. API 端点 ✅
- `/api/auth/signin` - GitHub OAuth 登录
- `/api/auth/callback` - OAuth 回调处理
- `/api/auth/signout` - 退出登录
- `/api/test` - GitHub API 连接测试

### 待开发的功能

- [ ] 仓库管理（添加/删除/查看仓库）
- [ ] 翻译配置（目标语言选择）
- [ ] 翻译任务管理
- [ ] GitHub App Webhook 接收
- [ ] 自动翻译处理
- [ ] 翻译进度追踪
- [ ] 翻译结果预览

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

1. 访问首页：`http://localhost:3000`
2. 点击"开始使用"
3. 点击"使用 GitHub 登录"
4. 在 GitHub 授权页面点击"Authorize"
5. 自动跳转到 Dashboard

## 📁 项目结构

```
github-global/
├── app/
│   ├── (auth)/
│   │   └── login/           # 登录页面
│   ├── api/
│   │   ├── auth/            # 认证 API
│   │   │   ├── callback/    # OAuth 回调
│   │   │   ├── signin/      # 登录请求
│   │   │   └── signout/     # 退出登录
│   │   └── test/            # API 测试
│   ├── dashboard/           # Dashboard
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 首页
├── components/
│   └── ui/                  # UI 组件
├── lib/
│   ├── auth/                # 认证逻辑
│   ├── db/                  # 数据库
│   ├── fetch.ts             # Fetch 工具
│   ├── github-fetch.ts      # GitHub API
│   └── utils.ts             # 工具函数
├── prisma/
│   ├── schema.prisma        # 数据库模型
│   └── migrations/          # 数据库迁移
└── .env.local               # 环境变量配置
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

### 问题 3：网络连接问题

如果遇到 GitHub API 连接超时：

1. 测试网络连接：
```bash
ping github.com
```

2. 测试 API 连接：
```bash
curl http://localhost:3000/api/test
```

3. 如果仍然失败，可能是代理问题。配置代理：
```env
# 在 .env.local 中添加
HTTP_PROXY=http://your-proxy:port
HTTPS_PROXY=http://your-proxy:port
```

### 问题 4：端口被占用

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

## 📊 测试端点

- `GET /api/test` - 测试 GitHub API 连接
- `GET /login` - 登录页面
- `GET /api/auth/signin` - 启动 OAuth 流程
- `GET /dashboard` - Dashboard（需要登录）

## 🎯 下一步开发

### 短期目标
1. 实现仓库列表页面
2. 添加 GitHub App 集成
3. 实现基本的翻译配置

### 中期目标
1. Webhook 处理
2. 翻译任务队列
3. 翻译进度追踪

### 长期目标
1. 多语言支持
2. 翻译质量评估
3. 翻译历史记录

## 📝 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **数据库**: MySQL + Prisma ORM
- **样式**: Tailwind CSS
- **认证**: 自定义 OAuth 实现
- **部署**: Vercel（推荐）

## 📞 支持

如遇问题，请检查：
1. 服务器日志：控制台输出
2. 浏览器控制台：前端错误
3. API 测试：`/api/test` 端点
4. 数据库状态：`npx prisma studio`

---

**最后更新**: 2026-02-18
**版本**: 1.0.0
**状态**: ✅ 可用于开发和测试

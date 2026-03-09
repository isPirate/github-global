# GitHub Global - 项目状态

## 当前状态

**当前版本：v2.2**

最近一轮更新已完成：
- 营销首页重构
- Dashboard / Repositories / Tasks / Settings 重构
- 登录入口改为首页直达 GitHub OAuth
- `/login` 不再作为正常登录页面
- 仓库页和任务页改为各自独立搜索
- 侧边栏支持折叠状态持久化和桌面端宽度调节
- 登录循环问题已修复：middleware 只做 cookie 级鉴权

## 已完成功能

### 认证
- GitHub OAuth 登录
- Session Cookie 管理
- `/api/auth/callback` 处理 OAuth 回调
- `/api/auth/signout` 退出登录
- `/api/auth/me` 获取当前用户信息

### GitHub App 集成
- GitHub App 安装链接获取
- 安装状态同步
- 仓库权限管理跳转
- Webhook 事件接收

### 仓库管理
- 自动同步用户已授权仓库
- 仓库列表展示
- 仓库配置页
- 启用 / 禁用仓库
- 手动触发翻译
- 仓库页内搜索

### 翻译任务
- 任务列表展示
- 状态筛选
- 任务页内搜索
- 文件级详情展开
- 失败任务重试
- PR 链接与 GitHub 仓库链接

### 设置
- 账户信息
- GitHub App 管理
- OpenRouter API Key 管理
- 默认翻译偏好设置
- 退出登录

## 当前页面

- `/` - 营销首页
- `/dashboard` - 总览页
- `/repositories` - 仓库列表
- `/repositories/[id]/config` - 仓库配置
- `/tasks` - 任务列表
- `/settings` - 设置页

> 当前正常登录不经过 `/login`。
> 首页 CTA 和受保护页面未登录跳转都直接进入 `/api/auth/signin`。

## 认证流说明

当前认证流程：
1. 用户访问首页 `/`
2. 点击“使用 GitHub 登录”
3. 跳转 `/api/auth/signin`
4. GitHub OAuth 授权
5. 回调 `/api/auth/callback`
6. 创建 session cookie
7. 重定向 `/dashboard`

中间件当前只做：
- `127.0.0.1 -> localhost` 统一
- 受保护页面是否存在 `session` cookie 的轻量检查

页面和 API 内部再用 `getSession()` 做完整校验。

## 重要 API

### Auth
- `GET /api/auth/signin`
- `GET /api/auth/callback`
- `POST /api/auth/signout`
- `GET /api/auth/me`

### GitHub App
- `GET /api/github-app/install-link`
- `GET /api/github-app/installation-url`
- `GET /api/github-app/installations`
- `POST /api/github-app/auto-sync`
- `POST /api/github-app/sync`

### Repositories
- `GET /api/repositories`
- `POST /api/repositories/[id]/config`
- `POST /api/repositories/[id]/enable`
- `POST /api/repositories/[id]/disable`
- `POST /api/repositories/[id]/translate`
- `GET /api/repositories/[id]/translations`

### Tasks
- `GET /api/tasks`
- `GET /api/tasks/[id]`
- `POST /api/tasks/[id]`

## 待优化项

- 实时任务推送（WebSocket / SSE）
- 更完整的翻译结果预览
- 更细的仓库筛选和排序
- 术语表 / 翻译记忆库

## 文档注意事项

- 文档中不再保留任何真实密钥、密码或 Secret
- 本地开发统一使用 `http://localhost:3000`
- 旧的 `/login` 页面描述、NextAuth.js 描述、过时页面结构均已弃用

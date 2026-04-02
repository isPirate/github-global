# GitHub Global - 项目状态

## 当前状态

**当前版本：v2.3**

最近一轮更新已完成：
- 营销首页重构
- Dashboard / Repositories / Tasks / Settings 重构
- 登录入口改为首页直达 GitHub App 登录
- `/login` 不再作为正常登录页面
- 仓库页和任务页改为各自独立搜索
- 侧边栏支持折叠状态持久化和桌面端宽度调节
- 登录循环问题已修复：middleware 只做 cookie 级鉴权
- app shell 的顶部用户区和侧边栏底部账户菜单已统一到共享组件
- 仓库配置页已改为服务端先注入 session 用户，再由客户端加载配置内容，避免用户信息闪烁或丢失
- 仓库配置页已简化为“语言 / 翻译内容 / 运行方式 / 引擎”四段式流程，默认源语言改为自动识别
- 仓库配置页支持全球语言搜索多选，以及按仓库文件列表手动选择要翻译的文档
- 仓库配置页的基准语言、目标语言搜索、引擎类型和模型选择已统一为同风格弹层列表，长列表不再直接撑满页面
- 新的下拉交互已支持打开后键盘输入定位、自动滚动到当前选中项，并保留选中态高亮
- 仓库卡片和总览仓库概览的操作区布局已固定，不再被内容长度挤压
- 翻译配置保存与任务执行会自动排除基准语言，避免把源语言再次当成目标语言翻译
- OpenRouter 自定义模型 ID 已调整为跟随模型选择器内联展示，不再藏在高级设置里
- OpenRouter 模型列表已改为仅展示接口实时返回数据，不再混入前端硬编码常用模型
- 新仓库首次进入配置页时，会自动继承用户偏好里保存的默认目标语言
- 若用户已在 Settings 配置全局 OpenRouter Key，仓库配置保存时允许不填写仓库级 Key，并在执行翻译时回退使用用户级 Key
- 翻译任务会默认创建分支并自动提交 PR，同时保留任务与文件历史用于追踪和排查
- 仓库配置新增监听分支；Webhook 自动触发、手动翻译和候选文件列表会优先使用配置中的首个分支，留空时回退到仓库默认分支
- 任务页右下角的自动刷新提示已覆盖 `pending` 和 `processing` 任务，活跃任务存在时会持续转圈提示
- 翻译任务创建 PR 时的标题与正文文案已修正乱码，标题恢复使用 `→`
- 已补充 `docs/API接口文档.md`，便于后续联调与排障
- 环境变量已收敛为 `APP_BASE_URL`、`GITHUB_APP_WEBHOOK_URL`、`GITHUB_APP_SLUG` 等更清晰的命名，不再保留旧的 `APP_URL` / `GITHUB_APP_NAME` / `NEXTAUTH_*` 配置

## 已完成功能

### 认证
- GitHub App 登录
- Session Cookie 管理
- `/api/auth/callback` 处理 GitHub App 用户授权回调
- `/api/auth/signout` 退出登录
- `/api/auth/me` 获取当前用户信息

### GitHub App 集成
- GitHub App 安装链接获取
- 安装状态同步
- 仓库权限管理跳转
- Webhook 事件接收
- GitHub App 已订阅并送达的仓库事件可按配置自动创建翻译任务

### 仓库管理
- 自动同步用户已授权仓库
- 仓库列表展示
- 仓库配置页
- 仓库候选文件列表接口
- 启用 / 禁用仓库
- 手动触发翻译
- 仓库页内搜索
- 仓库卡片操作区稳定布局
- 仓库配置页下拉交互统一与键盘定位优化

### 翻译任务
- 任务列表展示
- 状态筛选
- 任务页内搜索
- 文件级详情展开
- 失败任务重试
- PR 链接与 GitHub 仓库链接
- 手动触发翻译时显示任务 ID
- 基准语言不会再被重复纳入目标翻译任务

### 设置
- 账户信息
- GitHub App 管理
- OpenRouter API Key 管理
- 默认翻译偏好设置
- 默认目标语言可作为新仓库配置初始值
- 用户级 OpenRouter Key 可作为仓库级 Key 的回退来源
- 退出登录

## 最近关键提交

最近一轮已合入的关键提交主要包括：
- `b8af16a`：统一 GitHub App webhook 自动触发流程，移除仓库级 webhook 遗留并补齐相关迁移与文档
- `3014191`：统一环境变量命名，收敛为 `APP_BASE_URL`、`GITHUB_APP_WEBHOOK_URL`、`GITHUB_APP_SLUG`
- `795a9b9`：优化仓库配置里的下拉列表 UI
- `115385d`：统一下拉列表 UI
- `e0608c3`：调整组件布局和样式，修复操作区被内容挤压的问题
- `13e27a4`：移除模型 ID 硬编码，修复不可用模型 ID 问题
- `f41328a`：允许用户级 OpenRouter API Key 作为仓库级 Key 的回退来源

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
4. GitHub App 用户授权
5. 回调 `/api/auth/callback`
6. 创建 session cookie
7. 重定向 `/dashboard`

中间件当前只做：
- `127.0.0.1 -> localhost` 统一
- 受保护页面是否存在 `session` cookie 的轻量检查

页面和 API 内部再用 `getSession()` 做完整校验。

## Webhook 自动触发说明

当前 webhook 自动触发模型：
1. GitHub App 使用单个 App 级 webhook 接收事件
2. `installation` 和 `installation_repositories` 只用于安装同步
3. 其他带仓库上下文的已送达事件，会按仓库配置判断是否自动创建翻译任务
4. `push` 事件会按仓库配置中的监听分支判断是否自动翻译；若未配置，则回退到默认分支
5. 手动翻译与自动创建 PR 也会跟随任务源分支，避免固定回到默认分支
6. 仓库配置页中的“自动触发 / 仅手动运行”决定收到事件后是否真正创建任务

> 当前不需要在每个仓库里单独配置 webhook URL。

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
- `GET /api/repositories/[id]/files`
- `GET /api/repositories/[id]/translations`

### Tasks
- `GET /api/tasks`
- `GET /api/tasks/[id]`
- `POST /api/tasks/[id]`

> 完整接口清单见 `docs/API接口文档.md`。

## 待优化项

- 实时任务推送（WebSocket / SSE）
- 更完整的翻译结果预览
- 更细的仓库筛选和排序
- 术语表 / 翻译记忆库

## 文档注意事项

- 文档中不再保留任何真实密钥、密码或 Secret
- 纯本地开发建议使用 `http://localhost:3000`
- 如果通过 ngrok 域名访问，`GITHUB_APP_USER_CALLBACK_URL` 必须与 GitHub App 后台配置完全一致
- GitHub App 安装链接统一以 `GITHUB_APP_SLUG` 为准，Webhook 地址统一以 `GITHUB_APP_WEBHOOK_URL` 为准
- 根目录 `.env` 仅保留 `DATABASE_URL`，完整应用配置统一维护在 `.env.local`
- 旧的 `/login` 页面描述、NextAuth.js 描述、过时页面结构均已弃用
- 接口改动后同步维护 `docs/API接口文档.md`

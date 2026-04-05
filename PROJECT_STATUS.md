# GitHub Global - 项目状态

本文档用于描述当前版本的交付状态、已落地能力、近期关键变化与已知后续方向。

## 版本摘要

- 更新时间：2026-04-05
- 当前判断：主流程闭环已完成，当前版本已经具备可演示、可联调、可继续收口的产品基础
- 当前文档入口：
  - `README.md`：外部入口
  - `docs/快速启动说明.md`：本地启动
  - `docs/API接口文档.md`：现行接口契约
  - `CLAUDE.md`：协作上下文

## 本版本已交付

- 营销首页、Dashboard、Repositories、Tasks、Settings 已统一到同一套 app shell 和视觉体系
- 登录入口已收敛为首页直达 GitHub App 登录，正常流程不再经过 `/login`
- middleware 只保留 cookie 级鉴权与 `127.0.0.1 -> localhost` 统一，登录循环问题已修复
- 仓库配置页已简化为“语言 / 翻译内容 / 运行方式 / 引擎”四段式流程，默认源语言为自动识别
- 仓库配置支持全球语言搜索多选、手动选文件、监听分支与默认分支回退
- OpenRouter 模型列表改为仅展示接口实时返回数据，不再混入前端硬编码常用模型
- 新仓库首次进入配置页时，会优先使用用户偏好中的默认目标语言
- 若用户已在 Settings 配置全局 OpenRouter Key，仓库级 Key 可以留空并在翻译执行时回退使用
- Webhook 自动触发已统一到 GitHub App 单个 App 级 webhook，不再依赖仓库级 webhook
- 翻译任务会按任务来源分支创建翻译分支并回写 PR，同时保留任务和文件历史
- 任务页自动刷新提示已覆盖 `pending` 和 `processing` 状态
- 数据库已从本地 MySQL 迁移到 Supabase（托管 PostgreSQL），Prisma ORM 保持不变，业务代码零改动
- 最近一轮数据模型收口已移除不再实际生效的配置与安装字段：
  - `github_app_installations.access_token`
  - `github_app_installations.expires_at`
  - `translation_configs.target_branch_template`
  - `translation_configs.commit_message_template`
  - `translation_configs.sync_strategy`
  - `translation_tasks.estimated_cost`

## 已落地能力

### 认证

- GitHub App user authorization 登录
- Session Cookie 管理
- `/api/auth/callback` 处理 GitHub App 用户授权回调
- `/api/auth/signout` 退出登录
- `/api/auth/me` 获取当前用户信息

### GitHub App 集成

- GitHub App 安装链接获取
- 安装状态同步
- 仓库权限管理跳转
- App 级 Webhook 事件接收
- GitHub App 已订阅并送达的仓库事件可按配置自动创建翻译任务

### 仓库管理

- 自动同步用户已授权仓库
- 仓库列表展示与搜索
- 仓库配置页
- 仓库候选文件列表接口
- 监听分支下拉获取与保存
- 启用 / 禁用仓库
- 手动触发翻译

### 翻译任务

- 任务列表展示与搜索
- 状态筛选
- 文件级详情展开
- 失败任务重试
- PR 链接与 GitHub 仓库链接
- 手动触发翻译时显示任务 ID
- 基准语言自动从目标语言中剔除

### 设置

- 账户信息
- GitHub App 管理
- OpenRouter API Key 管理
- 默认翻译偏好设置
- 用户级 OpenRouter Key 回退
- 退出登录

## 近期关键提交

- `086d5f4`：清理过时配置与安装字段
- `8185bff`：修复仓库文件选择器构建报错
- `93fe720`：优化 GitHub App 安装与权限入口体验
- `32e9499`：优化监听分支配置交互与提示
- `280895f`：支持仓库监听分支配置与排序
- `b8af16a`：统一 GitHub App webhook 自动触发流程，移除仓库级 webhook 遗留并补齐相关迁移与文档
- `3014191`：统一环境变量命名，收敛为 `APP_BASE_URL`、`GITHUB_APP_WEBHOOK_URL`、`GITHUB_APP_SLUG`

## 当前页面

- `/`：营销首页
- `/dashboard`：总览页
- `/repositories`：仓库列表
- `/repositories/[id]/config`：仓库配置
- `/tasks`：任务列表
- `/settings`：设置页

## 当前行为说明

### 认证流

1. 用户访问首页 `/`
2. 点击“使用 GitHub 登录”
3. 跳转 `/api/auth/signin`
4. GitHub App 用户授权
5. 回调 `/api/auth/callback`
6. 创建 session cookie
7. 重定向 `/dashboard`

### Webhook 自动触发

1. GitHub App 使用单个 App 级 webhook 接收事件
2. `installation` 和 `installation_repositories` 用于安装同步
3. 其他带仓库上下文的已送达事件，会按仓库配置判断是否自动创建翻译任务
4. `push` 事件会按 `watchedBranches` 判断是否触发；留空时回退到默认分支
5. 手动翻译与自动创建 PR 都会跟随任务源分支
6. 仓库配置中的“自动触发 / 仅手动运行”决定是否真正入队

### 仓库配置

- 当前现行配置重点是：
  - `baseLanguage`
  - `targetLanguages`
  - `watchedBranches`
  - `scopeMode`
  - `selectedFiles`
  - `filePatterns`
  - `excludePatterns`
  - `triggerMode`
  - `engine`
- 不再把已移除的模板类字段当成当前能力描述

## 后续方向

- 实时任务推送（WebSocket / SSE）
- 更完整的翻译结果预览
- 更细的仓库筛选和排序
- 术语表 / 翻译记忆库
- 继续收口 GitHub App 相关接口的鉴权风格一致性

## 文档注意事项

- 文档中不再保留任何真实密钥、密码或 Secret
- 纯本地开发建议使用 `http://localhost:3000`
- 如果通过 ngrok 域名访问，`GITHUB_APP_USER_CALLBACK_URL` 必须与 GitHub App 后台配置完全一致
- GitHub App 安装链接统一以 `GITHUB_APP_SLUG` 为准，Webhook 地址统一以 `GITHUB_APP_WEBHOOK_URL` 为准
- 根目录 `.env` 保留 `DATABASE_URL` 和 `DIRECT_URL`，完整应用配置统一维护在 `.env.local`
- 数据库为 Supabase 托管 PostgreSQL，schema 变更通过 `npx prisma db push` 同步
- 接口改动后同步维护 `docs/API接口文档.md`
- 历史方案文档只保留背景价值，不再作为当前实现依据

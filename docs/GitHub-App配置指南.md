# GitHub App 配置指南

本指南用于配置 GitHub Global 当前实现所需的两类 GitHub 能力：

1. GitHub App：用户登录（user authorization）
2. GitHub App：仓库访问、PR 和 Webhook

## 一、GitHub App 用户授权（用于登录）

访问：
https://github.com/settings/apps

选择：
- 进入当前 GitHub App 设置页
- 配置用户授权能力与 callback URL

推荐配置：

- GitHub App name: `GitHub Global`
- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/callback`
- 开启 `Request user authorization (OAuth) during installation`
- 开启 `User-to-server token expiration`

保存后，把以下值写入 `.env.local`：

```env
GITHUB_APP_CLIENT_ID="Iv1.1234567890abcdef"
GITHUB_APP_CLIENT_SECRET="your_github_app_client_secret"
GITHUB_APP_USER_CALLBACK_URL="http://localhost:3000/api/auth/callback"
```

> 本地开发统一使用 `localhost`，不要混用 `127.0.0.1`。
> 项目根目录 `.env` 建议只保留 `DATABASE_URL`，不要再复制整份 `.env.local` 进去。

## 二、GitHub App（用于仓库操作）

访问：
https://github.com/settings/apps

点击：
- New GitHub App

推荐配置：

### 基本信息

- GitHub App name: `GitHub Global`
- Homepage URL: `http://localhost:3000`
- Description: `Automated translation tool for GitHub repositories`

### Webhook

- Active: 勾选
- Webhook URL: `http://localhost:3000/api/webhooks/github`
- Webhook secret: 随机字符串

> 本地开发若要真实接收 GitHub Webhook，请使用 ngrok 或 smee.io 暴露本地服务。

### Repository permissions

至少建议：

| 权限 | 级别 |
|------|------|
| Contents | Read & Write |
| Pull requests | Read & Write |
| Metadata | Read-only |

### Subscribe to events

需要在 GitHub App 后台手动订阅的事件，至少建议：

- `push`

如果你想方便测试自动触发，也可以临时额外订阅：

- `repository`

另外这两个事件是 GitHub App 默认就会收到的，不需要也不能手动勾选：

- `installation`
- `installation_repositories`

### 安装范围

MVP 本地开发推荐：
- Only on this account

## 三、私钥和 App 信息

创建 GitHub App 后：

1. 在详情页生成 private key
2. 下载 `.pem` 文件
3. 读取内容后写入 `.env.local`

```env
GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_SLUG="your_github_app_slug"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET="your_webhook_secret"
APP_BASE_URL="http://localhost:3000"
GITHUB_APP_WEBHOOK_URL="http://localhost:3000/api/webhooks/github"
```

> 不要把 `.pem` 文件或真实私钥内容提交到仓库或文档。

## 四、当前产品里的使用路径

配置完成后：

1. 启动本地服务：`npm run dev`
2. 打开 `http://localhost:3000`
3. 点击首页“使用 GitHub 登录”
4. 完成 GitHub App 登录
5. 进入 `/repositories`
6. 点击 GitHub App 安装 / 权限管理入口
7. 返回仓库页刷新仓库列表

> 当前正常登录流程不经过 `/login` 页面。

## 五、验证项

### 验证登录

- 首页 CTA 能跳转到 GitHub 登录
- 授权后能回到 `/dashboard`

### 验证仓库同步

- 仓库页能显示 GitHub App 安装入口
- 完成安装后可以刷新出授权仓库

### 验证 Webhook

- GitHub App 后台 Recent Deliveries 能看到 `/api/webhooks/github` 收到事件
- `installation` / `installation_repositories` 属于 GitHub App 默认事件，即使不在“Subscribe to events”里勾选也会送达
- 订阅 `push` 后，默认分支 push 能自动创建翻译任务
- 若额外订阅了 `repository`，仓库元数据事件也可用于测试自动触发
- 当前项目统一使用 GitHub App 的单个 App 级 webhook，不需要在每个仓库里再手动添加 webhook URL

## 六、常见问题

### 1. `redirect_uri_mismatch`

检查 GitHub App 的 callback URL 是否为：

```text
http://localhost:3000/api/auth/callback
```

### 2. 登录后又回到 GitHub 登录

先检查：
- 当前访问是否为 `http://localhost:3000`
- 是否混用了 `127.0.0.1`
- 本地服务是否已重启到最新代码

### 3. GitHub App 安装后看不到仓库

检查：
- 安装时是否选中了仓库
- App 权限是否足够
- 返回 `/repositories` 后是否已刷新

### 4. Webhook 本地不可达

本地开发需要使用隧道工具，例如：

```bash
ngrok http 3000
```

然后把 GitHub App Webhook URL 改成 ngrok 地址。

## 七、相关文档

- [快速启动说明](./快速启动说明.md)
- [OpenRouter API 配置指南](./OpenRouter-API配置指南.md)

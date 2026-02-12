# GitHub App 配置指南

本指南将帮助您创建和配置 GitHub App，用于 GitHub Global 的仓库操作和 Webhook 功能。

## 什么是 GitHub App？

GitHub App 是 GitHub 提供的一种应用集成方式，相比传统的 OAuth App，它具有以下优势：

- ✅ **细粒度权限**：精确到仓库级别的权限控制
- ✅ **更高的 API 限流**：每个仓库 5000 次/小时
- ✅ **独立 Bot 模式**：应用以独立的身份运行，不依赖用户
- ✅ **短期 Token**：1 小时自动刷新，更安全
- ✅ **组织支持**：完美支持组织级别的安装

## 步骤 1：创建 GitHub App

### 1.1 访问 GitHub 设置页面

登录 GitHub，访问：https://github.com/settings/apps

### 1.2 创建新 App

点击 **"New GitHub App"** 按钮。

### 1.3 填写基本信息

**GitHub App 名称**：
```
GitHub Global
```

**Homepage URL**：
```
http://localhost:3000
```

**Description**（可选）：
```
Automated translation tool for GitHub repositories
```

### 1.4 设置回调 URL（可选）

如果您需要处理安装回调：

**Setup URL**（可选）：
```
http://localhost:3000/install
```

**Callback URL**（可选）：
```
http://localhost:3000/api/github-app/callback
```

> **注意**：本地开发时，这些 URL 使用 `localhost`。生产环境请替换为您的域名。

## 步骤 2：配置 Webhook

### 2.1 启用 Webhook

勾选 **"Active"** 复选框。

### 2.2 配置 Webhook URL

**Webhook URL**：
```
http://localhost:3000/api/webhooks/github
```

> **生产环境**：替换为您的域名，如 `https://your-domain.com/api/webhooks/github`
>
> **本地开发**：使用 ngrok 或 smee.io 暴露本地服务
> - ngrok: `npm install -g ngrok` → `ngrok http 3000`
> - smee.io: 访问 https://smee.io/ 获取临时 URL

### 2.3 设置 Webhook 密钥

**Webhook secret**：
```
点击 "Generate" 按钮生成随机字符串
```

将生成的 secret 复制并保存到 `.env.local`：

```bash
GITHUB_APP_WEBHOOK_SECRET="your_webhook_secret_here"
```

### 2.4 选择 Webhook 事件

勾选以下事件：
- ✅ **Push events** - 监听代码推送事件

## 步骤 3：配置权限

### 3.1 Repository permissions

勾选以下权限：

| 权限 | 访问级别 | 说明 |
|------|----------|------|
| **Contents** | Read & Write | 读取和写入文件内容 |
| **Pull requests** | Read & Write | 创建和管理 Pull Request |
| **Metadata** | Read-only | 读取仓库元数据 |
| **Administration** | Read & Write | 管理 Webhook |

### 3.2 Organization permissions

如果需要在组织级别使用：

| 权限 | 访问级别 |
|------|----------|
| **Members** | Read-only |

### 3.3 Account permissions

| 权限 | 访问级别 |
|------|----------|
| **Email addresses** | Read-only |

### 3.4 用户权限

| 权限 | 访问级别 |
|------|----------|
| **Email addresses** | Read-only |

## 步骤 4：选择可见性

**Where can this GitHub App be installed?**

选择：
- ✅ **Only on this account**（仅用于个人开发）
- ⚪ **Any account**（公开给所有人使用）

> MVP 阶段建议选择 "Only on this account"

## 步骤 5：创建 App

点击页面底部的 **"Create GitHub App"** 按钮。

## 步骤 6：下载私钥

### 6.1 生成私钥

在创建成功后的页面，找到 **"Private keys"** 部分。

点击 **"Generate a private key"** 按钮。

### 6.2 下载私钥文件

GitHub 会生成一个 `.pem` 文件并自动下载。文件名格式为：
```
GitHub-Global.{随机字符}.pem
```

### 6.3 保存私钥到环境变量

**方法 1：直接复制内容**

1. 用文本编辑器打开 `.pem` 文件
2. 复制全部内容（包括 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`）
3. 将换行符替换为 `\n`，或保持原始换行

**方法 2：使用 Node.js 读取**

```bash
node -e "console.log(require('fs').readFileSync('GitHub-Global.pem', 'utf8').replace(/\n/g, '\\\\n'))"
```

**添加到 `.env.local`**：

```bash
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
```

> ⚠️ **安全提示**：永远不要将 `.pem` 文件提交到 Git 仓库！

## 步骤 7：获取 App ID 和 App Name

在 GitHub App 详情页，找到：

**App ID**：
```
123456  （示例）
```

**App 名称**（Slug）：
```
github-global  （通常是小写，URL 中显示的名称）
```

添加到 `.env.local`：

```bash
GITHUB_APP_ID="123456"
GITHUB_APP_NAME="github-global"
```

## 步骤 8：配置 GitHub OAuth（用于登录）

GitHub App 主要用于仓库操作，用户登录还需要单独的 GitHub OAuth App。

### 8.1 创建 OAuth App

访问：https://github.com/settings/developers

点击 **"OAuth Apps"** → **"New OAuth App"**

### 8.2 填写 OAuth App 信息

**Application name**：
```
GitHub Global
```

**Homepage URL**：
```
http://localhost:3000
```

**Application description**：
```
Automated translation tool for GitHub repositories
```

**Authorization callback URL**：
```
http://localhost:3000/api/auth/callback
```

### 8.3 创建 OAuth App

点击 **"Register application"**。

### 8.4 保存 Client ID 和 Client Secret

**Client ID**（显示在页面顶部）：
```
复制并保存到 .env.local
```

```bash
GITHUB_CLIENT_ID="your_client_id_here"
```

**Client Secret**（点击 "Generate a new client secret" 按钮）：
```
⚠️ 只显示一次，请立即复制！
```

```bash
GITHUB_CLIENT_SECRET="your_client_secret_here"
```

### 8.5 配置环境变量

```bash
# GitHub OAuth（用于登录）
GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"
GITHUB_OAUTH_CALLBACK_URL="http://localhost:3000/api/auth/callback"
```

## 步骤 9：验证配置

### 9.1 检查环境变量

确认 `.env.local` 包含所有必需的配置：

```bash
# 数据库
DATABASE_URL="mysql://root:password@localhost:3306/github_global"

# 加密密钥
ENCRYPTION_KEY="your-64-char-hex-key"

# GitHub OAuth
GITHUB_CLIENT_ID="your_oauth_client_id"
GITHUB_CLIENT_SECRET="your_oauth_client_secret"
GITHUB_OAUTH_CALLBACK_URL="http://localhost:3000/api/auth/callback"

# GitHub App
GITHUB_APP_ID="your_app_id"
GITHUB_APP_NAME="your_app_name"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET="your_webhook_secret"

# NextAuth
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# 应用配置
APP_URL="http://localhost:3000"
APP_NAME="GitHub Global"
```

### 9.2 测试 GitHub App 安装

1. 启动应用：`npm run dev`
2. 访问：http://localhost:3000/login
3. 登录后，访问 GitHub App 页面（您需要实现此页面）
4. 点击"安装 GitHub App"按钮
5. 跳转到 GitHub，完成安装

### 9.3 测试 Webhook

1. 在已安装的仓库中创建一个测试文件
2. 提交并推送到 GitHub
3. 检查应用日志，确认接收到 Webhook 事件

## 生产环境配置

### 域名配置

当部署到生产环境时，需要更新以下配置：

```bash
# 开发环境
APP_URL="http://localhost:3000"
GITHUB_OAUTH_CALLBACK_URL="http://localhost:3000/api/auth/callback"
Webhook URL: http://localhost:3000/api/webhooks/github

# 生产环境（替换为您的域名）
APP_URL="https://your-domain.com"
GITHUB_OAUTH_CALLBACK_URL="https://your-domain.com/api/auth/callback"
Webhook URL: https://your-domain.com/api/webhooks/github
```

### 更新 GitHub App 配置

1. 访问 GitHub App 设置页面
2. 更新 Homepage URL、Webhook URL 等
3. 重新生成 Webhook secret（推荐）

## 常见问题

### Q1: Webhook 无法连接到本地服务器

**问题**：GitHub 无法访问 `localhost:3000`

**解决方案**：
使用 ngrok 或 smee.io 暴露本地服务：

**ngrok**：
```bash
# 安装
npm install -g ngrok

# 启动隧道
ngrok http 3000

# 使用生成的 URL（如 https://abc123.ngrok.io）
# 更新 Webhook URL: https://abc123.ngrok.io/api/webhooks/github
```

**smee.io**：
```bash
# 安装
npm install -g smee-client

# 启动转发
smee -u https://smee.io/your-channel -t http://localhost:3000/api/webhooks/github
```

### Q2: Private Key 格式错误

**错误**：`PEM_read_bio_PrivateKey failed`

**解决方案**：
确保私钥格式正确，使用 `\n` 表示换行：

```bash
# ✅ 正确
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"

# ❌ 错误（单行）
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY----- MIIEpAIBAAKCAQEA... -----END RSA PRIVATE KEY-----"

# ❌ 错误（没有 \n）
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
```

### Q3: Installation Token 获取失败

**错误**：`404 Not Found` 或 `Resource not accessible`

**解决方案**：
1. 检查 App ID 是否正确
2. 检查 Private Key 是否完整
3. 确认用户已安装 GitHub App
4. 验证 JWT 生成逻辑（payload 的 `iss` 应该是 App ID）

### Q4: 权限不足

**错误**：`Resource not accessible by integration`

**解决方案**：
1. 检查 GitHub App 权限配置
2. 确认选择了正确的权限级别（Read & Write）
3. 重新安装 GitHub App（修改权限后需要重新安装）

## 参考资源

- [GitHub Apps 官方文档](https://docs.github.com/en/apps)
- [GitHub Apps 最佳实践](https://docs.github.com/en/apps/best-practices)
- [Creating a GitHub App](https://docs.github.com/en/apps/creating-github-apps)
- [Webhook 事件列表](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads)

## 下一步

完成 GitHub App 配置后，您可以：

1. [配置 OpenRouter API](./OpenRouter-API配置指南.md)
2. 启动应用并测试完整流程
3. 开始您的第一次翻译任务

祝您配置顺利！

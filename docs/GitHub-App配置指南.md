# GitHub App 配置指南

本文档面向两类读者：

1. 第一次接触 GitHub App，需要把项目完整接通的人
2. 已经能本地启动项目，但不确定 GitHub App 后台应该怎么配置的人

本文只解决“如何把 GitHub App 配到和当前项目实现一致”的问题。本文涉及的后台配置项，均应以 GitHub 官方文档为准；如果 GitHub 后台字段、入口或选项发生变化，请先核对官方文档再更新本文件。

官方参考：

- [Registering a GitHub App using URL parameters](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-using-url-parameters)
- [About the setup URL](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/registering-a-github-app/about-the-setup-url)
- [Authenticating as a GitHub App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app)

## 这份文档解决什么问题

当前项目同时使用 GitHub App 的两类能力：

1. GitHub App user authorization：用于用户登录
2. GitHub App installation + webhook：用于仓库访问、事件接收和 PR 操作

其中要特别区分：

- 用户登录和手动翻译，不要求一定接通 Webhook
- 如果你想要 GitHub 事件自动创建翻译任务，才需要额外配置公网可访问的 Webhook URL

## 当前项目需要的环境变量

把以下值配置到 `.env.local`：

```env
GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_CLIENT_ID="Iv1.1234567890abcdef"
GITHUB_APP_CLIENT_SECRET="your_github_app_client_secret"
GITHUB_APP_USER_CALLBACK_URL="http://localhost:3000/api/auth/callback"
GITHUB_APP_SLUG="your_github_app_slug"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET="your_webhook_secret"
APP_BASE_URL="http://localhost:3000"
GITHUB_APP_WEBHOOK_URL="https://your-public-domain.example.com/api/webhooks/github"
```

说明：

- `GITHUB_APP_USER_CALLBACK_URL` 对应 GitHub App 后台的 user authorization callback URL。
- `GITHUB_APP_SLUG` 对应 GitHub App URL 中 `/apps/<slug>` 的那一段。
- `GITHUB_APP_PRIVATE_KEY` 需要把 `.pem` 文件内容写成单行，并把换行替换成 `\n`。
- 本地开发统一使用 `localhost`，不要混用 `127.0.0.1`。
- `GITHUB_APP_WEBHOOK_URL` 只有在你要启用 GitHub 事件自动触发时才需要重点配置，而且它必须是公网可访问地址。

## 一、创建或检查 GitHub App 基本信息

如果你从来没有创建过 GitHub App，可以直接按下面的路径进入：

1. 打开 [https://github.com/settings/apps](https://github.com/settings/apps)
2. 如果是首次创建，点击右上角 `New GitHub App`
3. 如果已经创建过 App，就在列表里点开对应 App 的名称进入设置页

也可以直接使用创建页：

- [https://github.com/settings/apps/new](https://github.com/settings/apps/new)

进入设置页后，优先处理这几个区域：

1. `GitHub App name`
2. `Homepage URL`
3. `User authorization callback URL`
4. `Webhook`
5. `Repository permissions`
6. `Subscribe to events`

建议至少确认以下字段：

| 配置项                          | 当前项目建议值                              |
| ------------------------------- | ------------------------------------------- |
| App name                        | `GitHub Global` 或你的实际应用名          |
| Homepage URL                    | `http://localhost:3000`                   |
| Description                     | 简要描述项目用途                            |
| User authorization callback URL | `http://localhost:3000/api/auth/callback` |

说明：

- GitHub 官方区分 `callback URL` 与 `setup URL`。
- `callback URL` 用于 web application flow，也就是当前项目的登录回调。
- `setup URL` 是安装完成后的跳转页，不等同于登录回调；当前项目不是必须依赖它。
- 如果你在 GitHub 后台一时找不到某个字段，优先以 GitHub 当前设置页里的原始英文字段名为准，不要参考旧截图里的中文翻译。

## 二、User authorization 相关配置

当前代码中的登录入口是：

- `/api/auth/signin`：跳转 GitHub 授权
- `/api/auth/callback`：处理 GitHub 回调

对应源码：

- [app/api/auth/signin/route.ts](../app/api/auth/signin/route.ts)
- [app/api/auth/callback/route.ts](../app/api/auth/callback/route.ts)

在 GitHub App 后台需要确认：

- 已启用用户授权 web flow
- Callback URL 与 `GITHUB_APP_USER_CALLBACK_URL` 完全一致

对于第一次配置的人，建议按这个顺序检查：

1. 打开 GitHub App 设置页
2. 找到与用户授权相关的区域
3. 确认 `User authorization callback URL` 已填为 `http://localhost:3000/api/auth/callback`
4. 保存设置
5. 回到项目首页，通过“使用 GitHub 登录”实际走一遍授权流程

可选项：

- GitHub 官方支持 `Request user authorization (OAuth) during installation`
- 如果启用它，安装流程中可以顺带发起用户授权；官方说明中也提到启用后 `setup_url` 会不可用
- 当前项目正常登录入口已经是首页 CTA，因此这个选项不是必需项，可按你的安装体验偏好决定

## 三、Webhook 配置

先说结论：

- Webhook 对“自动触发翻译”是必须的
- Webhook 对“本地登录、仓库同步、手动触发翻译”不是必须的
- 如果配置 Webhook，GitHub App 后台填写的 URL 必须是公网可访问地址，不能是纯本地地址

当前项目统一使用 GitHub App 的单个 App 级 webhook，不需要在每个仓库里单独添加 webhook URL。

建议配置：

| 配置项         | 当前项目建议值                                |
| -------------- | --------------------------------------------- |
| Active         | 开启                                          |
| Webhook URL    | `https://your-public-domain.example.com/api/webhooks/github` |
| Webhook secret | 与 `GITHUB_APP_WEBHOOK_SECRET` 保持一致     |

说明：

- GitHub 后台这里不能保存 `http://localhost:3000/api/webhooks/github` 这类纯本地地址
- GitHub 从外部投递 Webhook 时，必须访问公网可达地址，例如 ngrok、Cloudflare Tunnel 或已部署环境域名
- 如果通过 ngrok 域名访问应用，`APP_BASE_URL`、`GITHUB_APP_WEBHOOK_URL`、`GITHUB_APP_USER_CALLBACK_URL` 都应同步改为对应公网地址
- 第一次接触时，最容易漏掉的是“GitHub 后台 Webhook URL 改了，但 `.env.local` 里的 `GITHUB_APP_WEBHOOK_URL` 没同步修改”，这两处需要保持一致。

推荐理解方式：

- 只想先跑通登录、仓库同步、手动翻译：Webhook 可以暂时不配
- 想让 `push` 等 GitHub 事件自动触发翻译：必须配置公网 Webhook
- 想在本地联调自动触发：需要先把本地服务通过隧道工具暴露出去

如果你现在只是第一次接触项目，可以直接这样执行：

1. 先把登录和仓库同步跑通
2. 先用手动翻译验证主流程
3. 只有当你要验证自动触发时，再去配置公网 Webhook

## 四、Repository permissions

当前项目至少需要以下仓库权限：

| 权限          | 级别         |
| ------------- | ------------ |
| Contents      | Read & Write |
| Pull requests | Read & Write |
| Metadata      | Read-only    |

这些权限分别对应当前实现里的几类能力：

- 读取仓库文件与分支
- 创建翻译分支、提交翻译结果
- 创建和更新 Pull Request
- 获取仓库基础信息

如果 GitHub 后台权限命名变化，请以官方文档当前字段为准。

第一次配置建议做法：

1. 先只按本文档给出的最小权限配置
2. 保存后回到项目中验证“仓库同步、文件读取、PR 创建”是否正常
3. 只有在 GitHub 返回明确权限不足时，再按报错补充额外权限

## 五、Subscribe to events

当前项目至少需要手动订阅：

- `push`

为了便于联调测试，你也可以额外订阅：

- `repository`

项目当前行为：

- `push` 事件会根据仓库配置中的 `watchedBranches` 判断是否自动创建翻译任务
- `repository` 等带仓库上下文的已送达事件也可用于联调自动触发
- `installation` 与 `installation_repositories` 主要用于安装同步

注意：

- 某些 GitHub App 事件属于默认安装生命周期事件，后台不一定作为普通“勾选项”出现
- 这类事件的后台呈现方式以 GitHub 当前官方文档与实际 UI 为准，不要仅凭旧截图判断

第一次配置时可以这样理解：

- 你需要主动勾选的是 `push`
- `repository` 只是在联调时更方便，不是必须项
- 安装相关事件主要看 Recent Deliveries 是否能送达，不要把它们和普通勾选事件混为一谈

## 六、生成私钥与填写 App 信息

创建 GitHub App 后：

1. 在 App 设置页生成 private key
2. 下载 `.pem` 文件
3. 读取内容后写入 `.env.local`

```env
GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_SLUG="your_github_app_slug"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET="your_webhook_secret"
```

不要把 `.pem` 文件或真实私钥提交到仓库。

如果你不知道 `App ID` 和 `slug` 去哪里找：

- `App ID`：在 GitHub App 设置页的基础信息区域可以看到
- `slug`：App 主页 URL 中 `/apps/<slug>` 的 `<slug>` 部分

## 七、在当前项目中的使用路径

配置完成后：

1. 启动本地服务：`npm run dev`
2. 打开 `http://localhost:3000`
3. 点击首页“使用 GitHub 登录”
4. 完成 GitHub App 用户授权
5. 进入 `/repositories`
6. 通过 GitHub App 安装入口授权仓库访问
7. 返回仓库页刷新列表

> 当前正常登录流程不经过 `/login` 页面。

## 八、验证项

### 验证登录

- 首页 CTA 能跳转到 GitHub 登录
- `/api/auth/callback` 回调成功后能进入 `/dashboard`

### 验证仓库同步

- 仓库页能显示 GitHub App 安装 / 权限管理入口
- 安装后可以刷新出授权仓库
- 如果仓库页始终空白，优先回看“安装时是否选择了仓库”以及“Contents / Pull requests 权限是否正确”

### 验证 Webhook

- GitHub App 后台 Recent Deliveries 能看到 `/api/webhooks/github` 收到事件
- 订阅 `push` 后，匹配监听分支的 push 能自动创建翻译任务
- 当前项目统一使用 GitHub App 的单个 App 级 webhook，不需要在每个仓库里再手动添加 webhook URL

如果你没有配置 Webhook，那么这里的验证项可以跳过；此时项目仍然可以走“手动触发翻译”路径。

## 九、常见问题

### 1. `redirect_uri_mismatch`

检查 GitHub App 后台 callback URL 是否与：

```text
http://localhost:3000/api/auth/callback
```

完全一致。

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

然后把 GitHub App 后台 Webhook URL 与 `GITHUB_APP_WEBHOOK_URL` 同步改为该公网地址。

## 相关文档

- [README.md](../README.md)
- [快速启动说明.md](快速启动说明.md)
- [OpenRouter-API配置指南.md](OpenRouter-API配置指南.md)

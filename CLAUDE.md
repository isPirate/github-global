# Claude AI 项目指引

## 项目概述
GitHub Global - GitHub 仓库自动化翻译平台，使用 AI 将仓库文档翻译成多语言并自动创建 PR。

## 技术栈
- Next.js 15 (App Router) + TypeScript
- MySQL + Prisma ORM
- GitHub App (JWT 认证) + GitHub OAuth (用户登录)
- OpenRouter API (翻译引擎)
- Tailwind CSS

## 核心架构

### 认证系统（双认证）
- **GitHub OAuth**: 用户登录 (`lib/auth/session.ts`)
- **GitHub App**: 仓库操作，使用 JWT (`lib/github/app.ts`)

### 数据模型（9个核心表）
```
User → GitHubAppInstallation → Repository
  ↓           ↓                      ↓
TranslationConfig          TranslationTask
  ↓                              ↓
TranslationEngine        TranslationFile
                                ↓
                          TranslationHistory
```

### 关键目录
```
lib/
├── auth/session.ts          # 会话管理
├── github/
│   ├── app.ts              # GitHub App JWT 客户端
│   └── client.ts           # OAuth API 客户端
├── translation/
│   ├── openrouter.ts       # 翻译引擎（支持模型降级）
│   ├── queue.ts            # p-queue 并发控制
│   └── markdown.ts         # Markdown 处理
└── crypto/encryption.ts     # API 密钥加密

app/api/
├── auth/                    # OAuth 认证
├── github-app/              # App 安装/同步
├── repositories/[id]/       # 仓库配置/翻译触发
├── tasks/                   # 翻译任务查询
└── webhooks/github/         # push 事件触发翻译
```

## 翻译工作流
1. 用户在仓库配置页设置目标语言
2. 触发方式：手动点击 OR Webhook (push 事件)
3. 队列处理：`p-queue` 并发控制
4. 文件发现：glob 模式匹配 + 内容哈希去重
5. 翻译：OpenRouter 多模型自动降级
6. 创建分支：`translate/{lang}` 分支
7. 创建 PR：自动提交到目标仓库

## 重要约定
- GitHub App ID: `2890267`
- 数据库: MySQL `github_global`
- 环境变量: `.env.local`（已配置）
- Webhook 需验证签名
- API 密钥必须加密存储

## 开发提示
- 修改 API 端点：`app/api/**/*.ts`
- 修改页面：`app/**/page.tsx`
- 数据库变更：修改 `prisma/schema.prisma` 后运行 `npx prisma db push`
- 查看数据库：`npx prisma studio`

## 按需阅读的文档（节省上下文）

### 必读（新会话开始时）
1. `CLAUDE.md` (本文件) - 项目快速概览
2. `PROJECT_STATUS.md` - 当前进度和已完成功能
3. `prisma/schema.prisma` - 数据模型（9个核心表）

### 按任务类型阅读

**添加/修改功能时：**
- `docs/技术实现方案文档.md` - 完整的技术设计、API 设计、模块接口

**理解业务逻辑时：**
- `docs/需求规格文档.md` - 产品需求、业务流程、用户场景

**修改数据库时：**
- `prisma/schema.prisma` - 数据模型定义
- `docs/技术实现方案文档.md` 第3章 - 数据库设计详解

**集成 GitHub 功能时：**
- `docs/技术实现方案文档.md` 第4.2-4.3章 - GitHub App 和 API 模块设计

**修改翻译功能时：**
- `docs/技术实现方案文档.md` 第4.4章 - 翻译引擎和 Markdown 处理
- `lib/translation/` 目录下的实现

**处理 Webhook 时：**
- `docs/技术实现方案文档.md` 第4.5章 - Webhook 模块设计

### 不需要阅读（给人读的配置）
- `docs/GitHub-App配置指南.md` - GitHub App 配置步骤
- `docs/OpenRouter-API配置指南.md` - OpenRouter API 配置
- `README.md` - 快速开始（与技术实现文档重复）

## 常用命令
```bash
npm run dev          # 开发服务器
npx prisma db push   # 同步数据库
npx prisma studio    # 数据库管理界面
```

## 可用的 MCP 工具（请主动使用）

### 📚 Context7 - 技术文档查询
**用途**：获取最新的库/框架文档和代码示例

**何时主动使用**：
- 用户询问 "如何使用 X 库" 时
- 需要查看某个库的最新 API 文档时
- 不确定某个库的用法时
- 添加新功能需要参考文档时

**示例场景**：
```
用户: "用 Zustand 替换 Redux"
AI 应该: 主动调用 Context7 查询 Zustand 最新文档
```

**不要等用户说**："去查一下 Zustand 文档"

### 🌐 Chrome DevTools - 浏览器自动化
**用途**：控制浏览器、调试前端、截图、分析性能

**何时主动使用**：
- 用户说 "页面有问题" 时 → 主动打开页面截图
- 用户说 "样式不对" 时 → 主动检查元素
- 用户说 "点击按钮没反应" 时 → 主动测试交互
- 需要验证前端功能时

**示例场景**：
```
用户: "登录按钮点不了"
AI 应该:
1. 打开 http://localhost:3000/login
2. 截图查看页面状态
3. 检查按钮元素和事件
```

### 🔍 Web Search Prime - 网页搜索
**用途**：搜索最新信息

**何时主动使用**：
- 用户提到报错，但本地没有相关信息
- 需要查找某个问题的解决方案
- 不确定某个技术/库的最新状态
- 查找最佳实践

### 📖 Web Reader - 网页内容读取
**用途**：将网页转换为 markdown，便于 AI 理解

**何时主动使用**：
- 用户分享了一个文档链接
- 需要参考在线教程
- 查看某个库的 GitHub README

### 🖼️ Zai MCP - 图像/视频分析
**用途**：分析截图、UI 图、数据可视化

**何时主动使用**：
- 用户上传了错误截图 → 用 `diagnose_error_screenshot`
- 用户分享 UI 设计图 → 用 `ui_to_artifact`
- 用户分享数据图表 → 用 `analyze_data_visualization`
- 需要分析图片内容 → 用 `analyze_image`

---

## 主动使用场景示例

### 场景 1：用户遇到 Next.js 报错
```
用户: "报错 TypeError: Cannot read properties of undefined"

AI 应该主动:
1. 用 Web Search 搜索这个报错
2. 用 Context7 查询 Next.js 相关文档
3. 检查相关代码文件
```

### 场景 2：用户想实现新功能
```
用户: "我想添加用户头像上传功能"

AI 应该主动:
1. 用 Context7 查询相关库（如 react-dropzone）文档
2. 检查现有用户数据模型
3. 给出实现方案
```

### 场景 3：前端样式问题
```
用户: "这个按钮样式不对"

AI 应该主动:
1. 用 Chrome DevTools 打开页面
2. 截图查看问题
3. 检查元素样式
```

### 场景 4：用户分享链接
```
用户: "参考这个文档 https://xxx"

AI 应该主动:
1. 用 Web Reader 读取链接内容
2. 理解文档内容
3. 应用到项目中
```

### 场景 5：用户上传截图
```
用户: [上传错误截图]

AI 应该主动:
1. 用 diagnose_error_screenshot 分析错误
2. 给出解决方案
```

---

## 重要原则

**主动 ≠ 盲目**
- 先判断任务类型
- 选择合适的工具
- 简要说明使用原因
- 展示工具结果

**示例**：
```
✅ 好的做法：
"让我用 Context7 查一下 Zustand 的最新文档..."
[调用工具]
"根据文档，正确的用法是..."

❌ 不好的做法：
[默默调用工具]
"[粘贴大量文档内容]"
```

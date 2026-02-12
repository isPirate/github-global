# OpenRouter API 配置指南

本指南将帮助您配置 OpenRouter API，用于 GitHub Global 的翻译功能。

## 什么是 OpenRouter？

OpenRouter 是一个统一的 AI 模型网关，具有以下优势：

- ✅ **统一接口**：一个 API 接入 100+ 模型
- ✅ **完全兼容**：支持 OpenAI SDK，零学习成本
- ✅ **模型切换**：改配置即可，无需改代码
- ✅ **自动降级**：内置 fallback 机制
- ✅ **成本优化**：自动选择最优价格

## 步骤 1：注册 OpenRouter 账号

### 1.1 访问 OpenRouter

打开浏览器，访问：https://openrouter.ai/

### 1.2 创建账号

点击右上角的 **"Sign in"** 按钮。

您可以选择以下方式注册：
- GitHub OAuth（推荐）
- Google OAuth
- 邮箱注册

### 1.3 完成注册

按照页面提示完成注册流程。

## 步骤 2：获取 API Key

### 2.1 进入设置

登录后，点击右上角的头像，选择 **"Settings"**。

### 2.2 生成 API Key

在左侧菜单中，选择 **"API Keys"**。

点击 **"Create Key"** 按钮。

### 2.3 复制 API Key

输入一个描述性名称（如 "GitHub Global Dev"），点击 **"Create"**。

> ⚠️ **重要提示**：API Key 只显示一次，请立即复制并妥善保存！

API Key 格式类似：
```
sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.4 保存 API Key

将 API Key 添加到应用的仓库翻译配置中。

**注意**：OpenRouter API Key 会在应用的数据库中加密存储，不会以明文形式保存。

## 步骤 3：选择模型

OpenRouter 支持 100+ 模型，访问 https://openrouter.ai/models 查看完整列表。

### 3.1 推荐模型

根据不同需求，推荐以下模型：

#### 高质量翻译

| 模型 ID | 特点 | 价格 |
|---------|------|------|
| `openai/gpt-4-turbo` | 最高质量，理解力强 | $$$ |
| `anthropic/claude-3.5-sonnet` | 出色翻译能力，长文本 | $$$ |
| `openai/gpt-4o` | 平衡质量和速度 | $$ |

#### 经济型翻译

| 模型 ID | 特点 | 价格 |
|---------|------|------|
| `openai/gpt-4o-mini` | 性价比高，速度快 | $ |
| `google/gemini-pro-1.5` | 成本低，支持长文本 | $ |
| `deepseek/deepseek-chat` | 超低成本，中文优秀 | ¢ |

### 3.2 查看模型详情

访问 https://openrouter.ai/models，您可以：

- 查看每个模型的定价
- 阅读用户评价
- 测试模型效果
- 查看上下文窗口大小

### 3.3 配置主模型和备用模型

GitHub Global 支持配置主模型和多个备用模型（fallback），当主模型失败时自动切换。

**示例配置**：

```json
{
  "model": "openai/gpt-4-turbo",
  "fallbackModels": [
    "openai/gpt-4o",
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o-mini"
  ],
  "temperature": 0.3,
  "maxTokens": 4000
}
```

## 步骤 4：充值（可选）

OpenRouter 支持按使用量付费，您可以先充值再使用。

### 4.1 进入计费页面

在 Settings 中，选择 **"Billing"**。

### 4.2 添加支付方式

支持以下支付方式：
- 信用卡
- 借记卡
- PayPal

### 4.3 充值

选择充值金额，完成支付。

**建议的初始充值**：
- 测试阶段：$5-10
- 小型项目：$20-50
- 中型项目：$100+

### 4.4 设置消费限制

为了避免意外超支，可以设置：
- 月度消费上限
- 单次请求最大 Token 数

## 步骤 5：在应用中配置

### 5.1 登录应用

1. 启动 GitHub Global 应用
2. 使用 GitHub OAuth 登录
3. 进入 Dashboard

### 5.2 选择仓库

在仓库列表中，点击要配置的仓库。

### 5.3 配置翻译引擎

在仓库配置页面，找到 **"翻译引擎"** 部分：

**配置项**：

1. **API Key**
   - 输入您的 OpenRouter API Key
   - 格式：`sk-or-v1-...`

2. **主模型**
   - 选择主翻译模型
   - 推荐：`openai/gpt-4-turbo`

3. **备用模型**（可选）
   - 配置 fallback 模型
   - 当主模型失败时自动切换

4. **高级参数**
   - Temperature：0.1-1.0（默认 0.3）
   - Max Tokens：最大响应长度（默认 4000）

### 5.4 保存配置

点击 **"保存配置"** 按钮。

## 步骤 6：测试翻译

### 6.1 创建测试翻译任务

在仓库详情页，点击 **"立即翻译"** 按钮。

### 6.2 查看翻译结果

在翻译任务列表中，查看任务状态和结果。

### 6.3 检查日志

如果翻译失败，查看错误日志：
- API Key 是否正确
- 模型名称是否正确
- 账户余额是否充足

## 成本估算

### 翻译成本计算

OpenRouter 按输入和输出的 Token 数量计费。

**示例**：翻译 1000 字英文文档

| 模型 | 输入成本 | 输出成本 | 总成本 |
|------|----------|----------|--------|
| GPT-4 Turbo | $0.01 | $0.03 | $0.04 |
| GPT-4o | $0.005 | $0.015 | $0.02 |
| GPT-4o Mini | $0.00015 | $0.0006 | $0.00075 |
| Claude 3.5 Sonnet | $0.003 | $0.015 | $0.018 |

**估算工具**：
- https://openrouter.ai/?models
- 输入预计字数，查看各模型成本

### 省钱技巧

1. **使用小型模型**：大部分翻译任务 GPT-4o Mini 足够
2. **启用增量翻译**：只翻译变更部分
3. **设置 Token 限制**：避免过长文档消耗过多 Token
4. **使用缓存**：相同内容不重复翻译（后续功能）

## 常见问题

### Q1: API Key 无效

**错误**：`401 Unauthorized` 或 `Invalid API Key`

**解决方案**：
1. 检查 API Key 是否正确复制（以 `sk-or-v1-` 开头）
2. 确认没有多余空格或换行
3. 在 OpenRouter 设置中重新生成 API Key

### Q2: 模型不可用

**错误**：`Model not found` 或 `Model not accessible`

**解决方案**：
1. 检查模型名称拼写（如 `openai/gpt-4-turbo`）
2. 确认模型在 OpenRouter 上可用
3. 访问 https://openrouter.ai/models 查看可用模型列表

### Q3: 余额不足

**错误**：`Insufficient credits`

**解决方案**：
1. 在 OpenRouter Billing 页面充值
2. 检查账户余额
3. 设置备用模型（使用更便宜的模型）

### Q4: 超时或请求失败

**错误**：`Request timeout` 或 `504 Gateway Timeout`

**解决方案**：
1. 检查网络连接
2. 减小 `maxTokens` 值
3. 使用 fallback 模型
4. 联系 OpenRouter 支持

### Q5: 翻译质量不佳

**解决方案**：
1. 调整 `temperature` 参数（0.1-0.5 更准确）
2. 尝试不同的模型
3. 在系统提示中添加更多上下文
4. 启用翻译记忆（后续功能）

## 环境变量配置（可选）

如果您想使用统一的 OpenRouter API Key（不推荐，每个仓库使用独立的 Key 更安全），可以在 `.env.local` 中配置：

```bash
# OpenRouter API Key（可选，默认每个仓库单独配置）
OPENROUTER_API_KEY="sk-or-v1-your-key-here"

# 默认模型（可选）
OPENROUTER_DEFAULT_MODEL="openai/gpt-4-turbo"

# Fallback 模型（可选）
OPENROUTER_FALLBACK_MODELS="openai/gpt-4o,openai/gpt-4o-mini"
```

## 安全建议

1. **不要共享 API Key**
   - API Key 就像密码，不要泄露给他人
   - 不要在公开代码仓库中提交

2. **定期轮换 API Key**
   - 每隔几个月更换一次 API Key
   - 在 OpenRouter 设置中可以撤销旧的 Key

3. **监控使用情况**
   - 定期检查 OpenRouter Dashboard
   - 查看使用量和费用
   - 设置消费上限

4. **使用独立的 API Key**
   - 为每个项目使用不同的 API Key
   - 便于追踪和管理

## 参考资源

- [OpenRouter 官方文档](https://openrouter.ai/docs)
- [OpenRouter 模型列表](https://openrouter.ai/models)
- [OpenRouter 定价](https://openrouter.ai/docs#models)
- [OpenAI SDK 文档](https://github.com/openai/openai-node)

## 下一步

完成 OpenRouter 配置后，您可以：

1. 启动第一次翻译任务
2. 查看翻译结果和成本
3. 根据需要调整模型和参数
4. 配置更多仓库的翻译

祝您翻译顺利！

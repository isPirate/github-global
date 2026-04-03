# OpenRouter API 配置指南

本文档用于说明如何为 GitHub Global 获取并配置 OpenRouter API Key，以及如何按当前项目真实行为验证模型与调用链路。第三方产品的具体页面、字段和入口如有变化，请以 OpenRouter 官方文档为准。

官方参考：

- [OpenRouter Authentication](https://openrouter.ai/docs/api/reference/authentication)
- [OpenRouter API Reference Overview](https://openrouter.ai/docs/api/reference/overview)
- [OpenRouter List available models](https://openrouter.ai/docs/api/api-reference/models/get-models)

## 这份文档解决什么问题

当前项目使用 OpenRouter 作为翻译模型网关，主要涉及三件事：

1. 获取可用 API Key
2. 在项目中保存仓库级或用户级 Key
3. 使用实时模型列表选择翻译模型

## 当前项目里的真实行为

当前实现要点：

- OpenRouter 模型列表来自 `GET /api/openrouter/models`
- 该接口会请求 OpenRouter 官方模型接口 `https://openrouter.ai/api/v1/models`
- 仓库配置可以保存仓库级 OpenRouter Key
- Settings 页面可以保存用户级 OpenRouter Key
- 翻译执行时会优先使用仓库级 Key，再回退到用户级 Key
- Key 在数据库中加密存储，不会以明文回写给前端

相关源码：

- [app/api/openrouter/models/route.ts](../app/api/openrouter/models/route.ts)
- [app/api/user/settings/route.ts](../app/api/user/settings/route.ts)
- [lib/translation/openrouter.ts](../lib/translation/openrouter.ts)

## 一、注册并登录 OpenRouter

访问 [https://openrouter.ai/](https://openrouter.ai/)。

OpenRouter 当前支持通过网页创建账号并登录。具体登录方式、页面结构和入口以 OpenRouter 官方当前 UI 为准。

如果你是第一次进入，建议这样找：

1. 打开 OpenRouter 首页
2. 先完成登录
3. 登录后再进入账户设置或 API Key 管理区域
4. 如果页面结构和本文档不同，以 OpenRouter 官方文档和当前导航名称为准

## 二、创建 API Key

根据 OpenRouter 官方 Authentication 文档：

- OpenRouter 使用 Bearer Token 进行认证
- 你可以为 key 设置名称，也可以视官方当前能力设置额度或限制

建议流程：

1. 登录 OpenRouter
2. 打开账户设置中的 API Key 管理页面
3. 创建一个新的 key
4. 立即复制并保存

如果你是第一次操作，尽量遵循这个判断顺序：

- 先找 account settings / settings
- 再找 `API Keys`、`Keys` 或类似名称的页面
- 进入后新建一条专门给本项目使用的 key

项目中使用的 key 形态通常类似：

```text
sk-or-v1-...
```

> API Key 只应保存在密码管理器或本地安全环境中，不要提交到仓库。

## 三、在项目中配置 Key

### 方案 1：仓库级 Key

适用于只想给单个仓库配置翻译能力的情况。

操作路径：

1. 登录应用
2. 进入 `/repositories`
3. 打开某个仓库的配置页
4. 在引擎配置区域填写 OpenRouter Key 与模型
5. 保存配置

适合：

- 只想给某个仓库单独配置模型或单独控制额度
- 不希望多个仓库共用同一份 key

### 方案 2：用户级 Key

适用于想让多个仓库共享同一份 OpenRouter Key 的情况。

操作路径：

1. 登录应用
2. 进入 `/settings`
3. 保存全局 OpenRouter Key

适合：

- 多个仓库共用同一份 OpenRouter 凭据
- 希望新建仓库配置时减少重复填写

项目当前行为：

- 新建仓库级引擎时，如果 Settings 中已经配置了全局 OpenRouter Key，可以允许仓库级 Key 留空
- 翻译执行时优先使用仓库级 Key，再回退到用户级 Key

## 四、选择模型

模型列表来源：

- 项目 UI 使用 OpenRouter 实时模型列表接口
- 当前不再混入前端硬编码常用模型
- 如果历史配置中的模型 ID 不在最新列表中，页面会以自定义模型形式继续显示，避免配置“消失”

建议流程：

1. 先通过项目内的模型列表选择当前可用模型
2. 如果需要核对模型 ID、上下文窗口或定价，再去 OpenRouter 官方模型页查看

第一次接触的人可以这样理解：

- 模型 ID 以项目页面下拉列表里能选到的为准
- 如果不确定选哪个，先用项目里当前可见且常见的通用模型
- 当你需要比对价格、能力或上下文窗口时，再回到 OpenRouter 官方模型页做二次确认

官方模型列表：

- [https://openrouter.ai/models](https://openrouter.ai/models)

官方模型接口：

- `GET https://openrouter.ai/api/v1/models`

## 五、验证 API Key 与模型链路

### 验证项目内配置

建议至少完成以下检查：

- Settings 页面保存全局 OpenRouter Key 后，再次进入能显示 `hasOpenRouterKey`
- 仓库配置页能够拉取模型列表
- 保存仓库翻译配置后可以手动触发翻译任务
- 翻译失败时，错误信息能区分 Key 无效、网络异常或模型不可用

### 验证 OpenRouter 账号状态

如果你想从 OpenRouter 侧确认当前 key 是否可用，可以参考官方文档中的：

- `GET /api/v1/key`

它用于读取当前认证会话对应 key 的信息。

## 六、常见问题

### 1. 模型列表为空

当前项目的 `GET /api/openrouter/models` 依赖外部网络请求 OpenRouter；如果 OpenRouter 不可达，接口会返回空数组和 `500`。

先检查：

- 本地网络是否可访问 `openrouter.ai`
- 是否需要配置代理
- OpenRouter 官方服务是否正常

### 2. API Key 无效

常见现象：

- 保存配置后翻译时报 `401`
- 后端日志显示 OpenRouter key 被拒绝

先检查：

- 是否完整复制了 `sk-or-v1-...`
- 是否多了空格或换行
- 是否误用了旧 key 或已撤销 key

### 3. 模型不可用或模型名错误

先检查：

- 模型 ID 是否来自当前 OpenRouter 官方模型列表
- 项目页面里是否已经加载到了最新实时列表
- 历史配置是否保留了旧模型 ID

### 4. 翻译超时或请求失败

先检查：

- 本地网络与代理
- OpenRouter 服务状态
- 当前模型是否暂时不可用

## 七、安全建议

- 不要把 OpenRouter API Key 提交到仓库或文档
- 优先通过项目页面保存 Key，避免手写到源码或常量中
- 定期轮换长期使用的 API Key
- 如果多人共用环境，优先使用用户级或仓库级分离的方式管理 Key

## 相关文档

- [README.md](../README.md)
- [快速启动说明.md](快速启动说明.md)
- [API接口文档.md](API接口文档.md)

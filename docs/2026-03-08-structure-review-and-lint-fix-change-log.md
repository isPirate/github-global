# 2026-03-08 目录结构审查与 Lint 修复技术说明

## 1. 背景

本次工作目标有两项：

1. 审查当前项目的目录与文件结构是否合理。
2. 修复当前 ESLint 报错，并在不扩大风险的前提下顺手整理明显不合理的结构。

本次调整采用“最小必要整理”原则，只处理以下两类问题：

- 已经造成 lint 失败或构建隐患的问题。
- 明显重复、无引用、职责重叠且低风险可收敛的问题。

未进行大规模目录重构，避免把功能性回归风险和审查成本放大。

## 2. 当前结构审查结论

### 2.1 合理部分

当前项目主结构整体是合理的，按职责分层比较清楚：

- `app/` 负责页面与 API 路由，符合 Next.js App Router 习惯。
- `components/` 承载通用布局、导航、页面片段和基础 UI 组件。
- `lib/` 承载认证、GitHub 集成、翻译、加密、数据库等领域逻辑。
- `prisma/` 单独管理 schema 与迁移。
- `docs/` 已独立存放产品、方案和接入文档。

这说明项目不是“结构混乱型”仓库，主要问题集中在局部重复和实现分叉。

### 2.2 发现的问题

本次审查确认了以下结构问题：

1. `components/user-menu.tsx` 与 `components/header/user-menu.tsx` 职责重叠，且实现已经分叉。
2. `components/app-layout.tsx` 与 `components/client-app-layout.tsx` 基本重复。
3. `components/app-layout.tsx` 原实现直接使用 React Hook，但文件本身没有承担清晰的“服务端包装层”职责，长期维护上容易继续分叉。
4. `app/repositories/page.tsx` 在页面文件内重复定义了一个本地 `cn()`，与 `lib/utils.ts` 的公共工具重复。

### 2.3 本次未处理的问题

以下问题存在，但不属于“明显低风险整理”范围，本次未动：

- `app/` 页面中仍有较多页面级数据获取、状态管理和展示逻辑耦合在单文件中。
- `dashboard` 页面仍使用原生 `<a>`，未统一收敛到 `next/link`。
- 目录层次仍偏“页面驱动”，尚未进一步抽象为更明显的 feature/module 结构。

这些项更适合作为后续独立重构任务处理，而不是和本次 lint 修复绑在一起。

## 3. 实施的变更

### 3.1 修复 lint 报错与相关 warning

修改文件：

- `app/repositories/page.tsx`
- `app/tasks/page.tsx`
- `app/repositories/[id]/config/page.tsx`

处理内容：

- 将 `useEffect` 中依赖的异步函数改为 `useCallback` 包裹，消除 `react-hooks/exhaustive-deps` 警告。
- 修正仓库页中文说明中的未转义引号，消除 `react/no-unescaped-entities` 错误。
- 删除仓库页内重复的本地 `cn()`，改为复用 `lib/utils.ts` 中的公共实现。

### 3.2 收敛重复组件

修改文件：

- 删除 `components/user-menu.tsx`
- 保留并继续使用 `components/header/user-menu.tsx`

原因：

- 已确认项目中实际被引用的是 `components/header/user-menu.tsx`。
- `components/user-menu.tsx` 无引用、功能重复、实现风格不同，继续保留只会增加维护噪音。

### 3.3 收敛布局重复实现

修改文件：

- `components/app-layout.tsx`
- 保留 `components/client-app-layout.tsx`

处理方式：

- 将 `components/app-layout.tsx` 改为薄包装层，只负责把参数转交给 `components/client-app-layout.tsx`。

原因：

- 避免两份布局代码继续复制粘贴式演化。
- 让服务端页面可以稳定依赖一个包装入口，而真实交互逻辑只保留在一个客户端布局中。

### 3.4 修复头像相关 lint warning

修改文件：

- `components/header/user-menu.tsx`
- `components/sidebar/user-profile.tsx`
- `app/settings/_components/account-section.tsx`
- `next.config.js`

处理内容：

- 将相关头像展示从 `<img>` 替换为 `next/image`。
- 在 `next.config.js` 中补充 GitHub 头像域名白名单。

原因：

- 这类 warning 很集中，属于低成本可清理项。
- 保持头像资源加载方式一致，减少后续重复处理。

## 4. 影响评估

### 4.1 行为影响

本次改动不涉及业务逻辑变更，目标是：

- 保持现有页面行为不变。
- 清理 lint 问题。
- 降低重复组件和重复布局继续分叉的风险。

### 4.2 风险点

仍需关注以下点：

1. `next/image` 的远程头像来源目前按 GitHub 常见域名做了白名单，如果后续头像来源扩展，需同步补充。
2. 由于当前环境下 `next build` 仍受本机 `spawn EPERM` 限制影响，本次没有拿到完整构建通过证据。
3. 页面级组件仍然偏大，后续继续开发时应优先把数据请求逻辑和展示片段拆开。

## 5. 验证记录

本次实际运行的验证命令与结果如下：

### 5.1 Lint

命令：

```bash
npm.cmd run lint
```

结果：

```text
✔ No ESLint warnings or errors
```

### 5.2 构建

历史检查中执行过：

```bash
npm.cmd run build
```

结果为当前环境报错：

```text
[Error: spawn EPERM]
```

结论：

- 目前只能确认 lint 已通过。
- 不能基于当前环境证明生产构建通过。

## 6. 变更文件清单

- `app/repositories/page.tsx`
- `app/tasks/page.tsx`
- `app/api/tasks/route.ts`
- `app/repositories/[id]/config/page.tsx`
- `components/app-layout.tsx`
- `components/header/user-menu.tsx`
- `components/sidebar/user-profile.tsx`
- `app/settings/_components/account-section.tsx`
- `lib/db/prisma.ts`
- `next.config.js`
- 删除 `components/user-menu.tsx`
- 新增 `docs/plans/2026-03-08-structure-review-and-lint-fix.md`
- 新增 `docs/2026-03-08-structure-review-and-lint-fix-change-log.md`

## 7. 后续补充修复：任务列表页 500

### 7.1 现象

`/tasks` 页面加载时报前端错误：

```text
Error: Failed to fetch tasks
```

进一步在浏览器中直接请求 `/api/tasks`，服务端返回 500。

### 7.2 根因

实际根因分为两层：

1. 运行中的 Prisma Client 产物仍残留 `TranslationTask.userId`，会去查询数据库中不存在的 `translation_tasks.user_id` 列。
2. `app/api/tasks/route.ts` 中的搜索条件仍包含 `mode: 'insensitive'`，这对当前 MySQL 数据源不是一个稳妥的写法。

### 7.3 修复内容

修改文件：

- `app/api/tasks/route.ts`
- `lib/db/prisma.ts`
- `scripts/check-tasks-api-prereqs.js`

处理内容：

- 从任务接口的搜索条件中移除 `mode: 'insensitive'`。
- 在 Prisma 单例初始化处增加一层保护：如果检测到缓存中的 client 仍然包含过期的 `TranslationTask.userId` 元数据，则放弃复用并重建实例。
- 新增最小检查脚本，用于确认：
  - 任务接口源码不再使用 `mode: 'insensitive'`
  - Prisma 运行时 client 不再残留 `TranslationTask.userId`

### 7.4 验证结果

执行：

```bash
node scripts/check-tasks-api-prereqs.js
npm.cmd run lint
```

结果：

- 回归检查脚本通过
- ESLint 通过

另外，浏览器中再次请求 `/api/tasks` 后，原来的数据库列错误已经消失，不再返回 `translation_tasks.user_id does not exist`。当前浏览器会话随后返回 `401 Unauthorized`，说明数据库/Prisma 问题已解除，剩余是登录态问题，需要重新登录后继续验证页面。

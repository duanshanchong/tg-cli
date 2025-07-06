# Router v7 CLI

一个专门为 Router v7 项目设计的 CLI 工具，能够自动化创建、配置和部署 Router v7 应用到 Cloudflare Workers。

## 🚀 快速开始

### 第一步：安装和配置

1. **安装 CLI**
```bash
npm install -g router-v7-cli
```

2. **配置 Cloudflare 凭证**
```bash
router-cli config
```
- 输入你的 Cloudflare API Token
- Account ID 会自动检测（如果有多个账户，会提示选择）

### 第二步：创建项目

```bash
router-cli create-project
```

**选择项目配置：**
- **项目名称**: 例如 `my-api-app`
- **模板类型**: 
  - `basic` - 基础模板（推荐新手）
  - `api` - API 模板（推荐后端开发）
  - `fullstack` - 全栈模板（推荐全栈开发）
  - `custom` - 自定义模板
- **特性选择**:
  - `database` - 数据库支持
  - `auth` - 身份认证
  - `cache` - 缓存支持
  - `kv` - KV 存储
  - `r2` - R2 对象存储

### 第三步：部署项目

```bash
# 进入项目目录
cd my-api-app

# 部署到生产环境
router-cli deploy

# 或部署到指定环境
router-cli deploy --env staging
```

### 第四步：查看部署结果

```bash
# 列出所有部署的项目
router-cli list-all
```

## 📋 完整使用流程

### 1. 初始设置

```bash
# 1. 安装 CLI
npm install -g router-v7-cli

# 2. 配置 Cloudflare 凭证
router-cli config
# 输入 API Token，Account ID 会自动检测
```

### 2. 创建新项目

```bash
# 3. 创建项目
router-cli create-project

# 交互式配置：
# - 项目名称: my-awesome-app
# - 模板: api
# - 特性: database, auth
# - 环境变量: NODE_ENV=production
```

### 3. 开发和部署

```bash
# 4. 进入项目目录
cd my-awesome-app

# 5. 安装依赖
npm install

# 6. 本地开发（可选）
npm run dev

# 7. 部署到生产环境
router-cli deploy

# 8. 部署到测试环境
router-cli deploy --env staging
```

### 4. 管理项目

```bash
# 9. 查看所有部署的项目
router-cli list-all

# 10. 重新部署项目
router-cli deploy my-awesome-app
```

## 🛠️ 命令详解

### `router-cli config`
配置 Cloudflare 凭证
```bash
# 交互式配置
router-cli config

# 直接指定参数
router-cli config --token YOUR_API_TOKEN --account YOUR_ACCOUNT_ID
```

### `router-cli create-project`
创建新的 Router v7 项目
```bash
# 交互式创建
router-cli create-project

# 直接指定参数
router-cli create-project --name my-app --template api
```

### `router-cli deploy`
部署项目到 Cloudflare
```bash
# 部署当前目录项目到生产环境
router-cli deploy

# 部署指定项目
router-cli deploy my-project-name

# 部署到指定环境
router-cli deploy my-project-name --env staging
```

### `router-cli list-all`
列出所有部署的项目
```bash
# 列出所有项目
router-cli list-all
```

## 📁 项目结构

创建的项目包含以下文件：

```
my-awesome-app/
├── package.json          # 项目依赖和脚本
├── wrangler.jsonc        # Cloudflare Workers 配置
├── tsconfig.json         # TypeScript 配置
├── .env.example          # 环境变量示例
└── src/
    ├── index.ts          # 应用入口点
    ├── router.ts         # 路由器配置
    └── routes/
        ├── index.ts      # 路由索引
        ├── api.ts        # API 路由 (可选)
        ├── auth.ts       # 认证路由 (可选)
        └── database.ts   # 数据库配置 (可选)
```

## 🌐 部署后的访问

项目部署成功后，可以通过以下 URL 访问：

```
生产环境: https://my-awesome-app.keepwatch.workers.dev
测试环境: https://my-awesome-app-staging.keepwatch.workers.dev
```

**默认端点：**
- `GET /` - 欢迎页面
- `GET /health` - 健康检查
- `GET /api/hello` - API 示例

## 🔧 开发指南

### 本地开发
```bash
cd my-awesome-app
npm install
npm run dev
```

### 添加新路由
在 `src/routes/` 目录下创建新的路由文件：

```typescript
// src/routes/users.ts
import { router } from '../router';

router.get('/api/users', () => {
  return new Response(JSON.stringify([
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ]), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

然后在 `src/routes/index.ts` 中导入：
```typescript
import './users';
```

### 环境变量
在 `wrangler.jsonc` 中配置环境变量：
```json
{
  "env": {
    "production": {
      "vars": {
        "NODE_ENV": "production",
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## 🚨 故障排除

### 常见问题

1. **API Token 权限不足**
   - 确保 API Token 具有 Workers 编辑权限
   - 检查 Account 和 Zone 权限

2. **部署失败**
   - 检查项目目录是否存在 `wrangler.jsonc`
   - 确保已安装项目依赖：`npm install`

3. **URL 无法访问**
   - 检查部署是否成功：`router-cli list-all`
   - 确认 URL 格式正确

4. **Account ID 错误**
   - 重新配置：`router-cli config`
   - 手动指定 Account ID

### 获取帮助
```bash
# 查看所有命令
router-cli --help

# 查看特定命令帮助
router-cli deploy --help
```

## 🎯 最佳实践

1. **项目命名**: 使用小写字母和连字符，如 `my-api-app`
2. **环境管理**: 使用 staging 环境进行测试，production 环境用于生产
3. **版本控制**: 将项目代码提交到 Git 仓库
4. **环境变量**: 敏感信息使用环境变量，不要硬编码
5. **错误处理**: 在路由中添加适当的错误处理

## 📈 下一步

- 查看 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- 学习 [Router v7 用法](https://github.com/kwhitley/itty-router)
- 探索更多 Cloudflare 服务（KV、D1、R2 等）

---

**Router v7 CLI** - 让 Cloudflare Workers 开发更简单！ 🚀

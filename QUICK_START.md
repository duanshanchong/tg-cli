# Router v7 CLI 快速开始指南

## 🚀 5分钟快速上手

### 第一步：安装和配置
```bash
# 安装 CLI
npm install -g router-v7-cli

# 配置 Cloudflare 凭证
router-cli config
# 选择认证方式：
# 1. API Token（推荐，适合自动化/CI）
# 2. wrangler login（适合本地开发/交互式）
```

### 第二步：创建项目
```bash
# 创建新项目
router-cli create-project

# 选择配置：
# - 项目名称: my-first-app
# - 模板: basic (推荐新手)
# - 特性: 保持默认
```

### 第三步：部署项目
```bash
# 进入项目目录
cd my-first-app

# 部署到 Cloudflare
router-cli deploy
```

### 第四步：查看结果
```bash
# 查看部署状态
router-cli list-all

# 访问你的应用
# URL 会显示在部署输出中
```

## 📋 完整工作流程

```bash
# 1. 安装 CLI
npm install -g router-v7-cli

# 2. 配置凭证
router-cli config

# 3. 创建项目
router-cli create-project

# 4. 进入项目目录
cd your-project-name

# 5. 安装依赖
npm install

# 6. 部署项目
router-cli deploy

# 7. 查看部署结果
router-cli list-all
```

## 🎯 常用命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `router-cli config` | 配置 Cloudflare 凭证 | `router-cli config` |
| `router-cli create-project` | 创建新项目 | `router-cli create-project` |
| `router-cli deploy [project]` | 部署项目 | `router-cli deploy my-app` |
| `router-cli list-all` | 查看所有项目 | `router-cli list-all` |

## 🤖 CI/CD 使用

### 非交互式配置
```bash
# 使用 API Token 配置（推荐用于 CI/CD）
router-cli config --auth-type token --token YOUR_API_TOKEN --account YOUR_ACCOUNT_ID

# 使用 wrangler login 配置
router-cli config --auth-type login
```

### 非交互式创建项目
```bash
# 创建基础项目
router-cli create-project --name my-app --template basic

# 创建 API 项目并立即部署
router-cli create-project --name my-api --template api --features database,auth --deploy

# 创建完整项目
router-cli create-project \
  --name my-fullstack \
  --template fullstack \
  --features database,auth,cache,kv,r2 \
  --env-vars "NODE_ENV=production,API_KEY=your-key"
```

### 非交互式部署
```bash
# 部署到生产环境
router-cli deploy my-app

# 部署到测试环境
router-cli deploy my-app --env staging
```

### 非交互式删除
```bash
# 删除 Worker（跳过确认）
router-cli delete-worker my-app --no-confirm
```

### GitHub Actions 示例
```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Router CLI
        run: npm install -g router-v7-cli
        
      - name: Configure CLI
        run: |
          router-cli config \
            --auth-type token \
            --token ${{ secrets.CLOUDFLARE_API_TOKEN }} \
            --account ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
            
      - name: Deploy
        run: router-cli deploy my-app
```

## 🌐 部署后的访问

部署成功后，你的应用可以通过以下 URL 访问：

```
https://your-project-name.keepwatch.workers.dev
```

**默认端点：**
- `GET /` - 欢迎页面
- `GET /health` - 健康检查
- `GET /api/hello` - API 示例

### 🔗 URL 访问说明

1. **部署后立即访问**：部署完成后，URL 会显示在终端输出中
2. **DNS 传播时间**：新部署的 URL 可能需要 1-3 分钟才能完全生效
3. **验证部署状态**：使用 `router-cli list-all` 查看所有项目的状态和 URL

### 🧪 测试你的应用

```bash
# 测试健康检查端点
curl https://your-project-name.workers.dev/health

# 测试 API 端点
curl https://your-project-name.workers.dev/api/hello

# 在浏览器中访问
open https://your-project-name.workers.dev
```

## 🔧 开发提示

### 添加新路由
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

### 重新部署
```bash
# 修改代码后重新部署
router-cli deploy

# 或部署到测试环境
router-cli deploy --env staging
```

## 🚨 常见问题

### URL 无法访问
1. **等待 DNS 传播**：新部署的 URL 需要 1-3 分钟才能生效
2. **检查部署状态**：运行 `router-cli list-all` 确认部署成功
3. **验证 URL 格式**：确保使用正确的 URL 格式

### 部署失败
1. **检查配置**：确保已运行 `router-cli config` 并配置了正确的 API Token
2. **检查依赖**：确保已运行 `npm install`
3. **检查网络**：确保网络连接正常

### 权限错误
1. **重新配置**：运行 `router-cli config` 重新配置凭证
2. **检查 API Token**：确保 API Token 有足够的权限
3. **检查账户 ID**：确保配置了正确的 Cloudflare 账户 ID
4. **选择认证方式**：可以选择 API Token 或 wrangler login 两种方式

### 认证方式说明
- **API Token**：适合自动化部署、CI/CD 环境，需要手动创建 Cloudflare API Token
- **wrangler login**：适合本地开发，会打开浏览器进行 OAuth 授权，无需手动管理 Token

### 认证方式选择建议
- **本地开发**：推荐使用 `wrangler login`，简单方便
- **CI/CD 环境**：推荐使用 API Token，自动化友好
- **两种方式都支持**：选择任意一种后，所有命令都能正常工作

## 📞 获取帮助

```bash
# 查看所有命令
router-cli --help

# 查看特定命令帮助
router-cli deploy --help

# 查看部署状态
router-cli list-all
```

---

**Router v7 CLI** - 让 Cloudflare Workers 开发更简单！ 🚀 
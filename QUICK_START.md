# Router v7 CLI 快速开始指南

## 🚀 5分钟快速上手

### 第一步：安装和配置
```bash
# 安装 CLI
npm install -g router-v7-cli

# 配置 Cloudflare 凭证
router-cli config
# 输入你的 Cloudflare API Token
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

## 🌐 部署后的访问

部署成功后，你的应用可以通过以下 URL 访问：

```
https://your-project-name.keepwatch.workers.dev
```

**默认端点：**
- `GET /` - 欢迎页面
- `GET /health` - 健康检查
- `GET /api/hello` - API 示例

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

1. **部署失败** → 确保已运行 `npm install`
2. **URL 无法访问** → 运行 `router-cli list-all` 查看状态
3. **权限错误** → 重新运行 `router-cli config`

## 📞 获取帮助

```bash
# 查看所有命令
router-cli --help

# 查看特定命令帮助
router-cli deploy --help
```

---

**Router v7 CLI** - 让 Cloudflare Workers 开发更简单！ 🚀 
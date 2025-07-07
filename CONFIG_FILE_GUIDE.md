# 配置文件使用指南

CLI 支持通过配置文件来设置项目配置，支持多环境和本地开发变量管理！

## 🚀 主要特性

### ✅ 多环境配置支持
- 生产环境、测试环境、本地开发环境
- 环境变量自动管理
- 本地开发变量隔离

### ✅ 配置文件模板系统
- 支持 JSON 格式的配置文件
- 可编辑的默认配置模板
- 环境变量优先级支持

## 📋 使用方法

### 1. 使用默认配置模板
```bash
# 创建项目时自动使用默认配置模板
router-cli create-project --name "my-project"

# 或指定模板
router-cli create-project --name "my-api" --template api
```

### 2. 环境变量管理

#### 本地开发变量 (.dev.vars)
```bash
# 复制模板文件
cp .dev.vars.example .dev.vars

# 编辑 .dev.vars 文件
NODE_ENV=development
API_KEY=your-dev-key
```

#### 多环境配置 (wrangler.jsonc)
```json
{
  "env": {
    "production": {
      "vars": {
        "NODE_ENV": "production",
        "API_KEY": "your-prod-key"
      }
    },
    "staging": {
      "vars": {
        "NODE_ENV": "staging",
        "API_KEY": "your-staging-key"
      }
    },
    "local": {
      "vars": {
        "NODE_ENV": "local",
        "API_KEY": "your-local-key"
      }
    }
  }
}
```

### 3. 环境变量优先级

CLI 按以下优先级读取环境变量：

1. **环境变量** (最高优先级)
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. **配置文件**
   - `~/.router-cli/config.json`

3. **默认值** (最低优先级)
   - 自动检测的默认值

## 🔧 脚本使用

### 简单部署脚本
```bash
# 使用环境变量部署
./scripts/example.sh
```

### CI/CD 环境变量
```bash
# 设置环境变量
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# 创建和部署项目
router-cli create-project --name "my-ci-project"
cd my-ci-project
router-cli deploy
```

## 📁 配置示例

### 本地开发变量 (.dev.vars)
```bash
# 本地开发环境变量
NODE_ENV=development
API_KEY=your-dev-api-key
DATABASE_URL=your-dev-database-url
DEBUG=true
```

### 多环境配置 (wrangler.jsonc)
```json
{
  "name": "my-api-app",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "env": {
    "production": {
      "vars": {
        "NODE_ENV": "production",
        "API_KEY": "your-prod-api-key",
        "DATABASE_URL": "your-prod-database-url"
      }
    },
    "staging": {
      "vars": {
        "NODE_ENV": "staging",
        "API_KEY": "your-staging-api-key",
        "DATABASE_URL": "your-staging-database-url"
      }
    },
    "local": {
      "vars": {
        "NODE_ENV": "local",
        "API_KEY": "your-local-api-key",
        "DATABASE_URL": "your-local-database-url"
      }
    }
  }
}
```

## 🎯 使用场景

### 1. 本地开发
```bash
# 创建项目
router-cli create-project --name "my-dev-app"

# 设置本地开发变量
cd my-dev-app
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars 文件

# 启动本地开发
npm run dev
```

### 2. 多环境部署
```bash
# 部署到测试环境
router-cli deploy --env staging

# 部署到生产环境
router-cli deploy --env production
```

### 3. CI/CD 集成
```yaml
# GitHub Actions 示例
- name: Deploy to Cloudflare Workers
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  run: |
    router-cli create-project --name "my-ci-app"
    cd my-ci-app
    router-cli deploy
```

### 4. 团队协作
- 使用统一的配置模板
- 环境变量通过 CI/CD 管理
- 本地开发变量隔离

## 📊 优势对比

### 之前（复杂配置）
```bash
# 需要手动配置多个文件
# 环境变量管理复杂
# 本地开发配置繁琐
```

### 现在（简化配置）
```bash
# 1. 创建项目（自动生成配置）
router-cli create-project --name "my-project"

# 2. 设置本地开发变量
cp .dev.vars.example .dev.vars

# 3. 多环境部署
router-cli deploy --env staging
router-cli deploy --env production
```

## ⚠️ 注意事项

1. **环境变量优先级**：环境变量 > 配置文件 > 默认值
2. **本地开发变量**：`.dev.vars` 文件不会被提交到版本控制
3. **多环境配置**：`wrangler.jsonc` 支持生产、测试、本地环境
4. **CI/CD 友好**：支持环境变量直接配置

## 🔍 故障排除

### 环境变量问题
```bash
# 检查环境变量
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID

# 重新配置
router-cli config
```

### 部署失败
1. 检查 API Token 权限
2. 验证 Account ID 是否正确
3. 确保项目名称唯一
4. 检查网络连接

## 📞 支持

如果需要添加更多配置选项或修改现有功能，请告知！ 
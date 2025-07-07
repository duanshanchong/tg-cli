# 配置文件使用指南

现在 CLI 支持通过配置文件来设置所有的 wrangler 变量，无需一个个参数传递！

## 🚀 主要改进

### ✅ 简化了配置系统
- 移除了 KV 命名空间、R2 存储桶、D1 数据库、Cron 触发器等相关配置
- 专注于基础的 Router v7 项目配置
- 更简洁、更轻量

### ✅ 新增配置文件支持
- 支持 JSON 格式的配置文件
- 可以生成配置文件模板
- 支持基础 wrangler 配置选项

## 📋 使用方法

### 1. 生成配置文件模板
```bash
# 生成基础配置文件
node bin/index.js create-project --generate-config --name "my-project"

# 生成指定模板的配置文件
node bin/index.js create-project --generate-config --name "my-api" --template api
```

### 2. 编辑配置文件
生成的配置文件包含所有可配置选项：
```json
{
  "project": {
    "name": "my-project",
    "template": "basic"
  },
  "environment": {
    "NODE_ENV": "production",
    "API_VERSION": "v1"
  },
  "wrangler": {
    "compatibility_date": "2024-01-01",
    "compatibility_flags": ["nodejs_compat"],
    "vars": {...}
  },
  "deploy": {
    "auto_deploy": true
  }
}
```

### 3. 使用配置文件创建项目
```bash
# 使用配置文件创建项目
node bin/index.js create-project --config my-project-config.json

# 使用配置文件并自动部署
node bin/index.js create-project --config my-project-config.json --deploy
```

## 🔧 脚本使用

### 配置文件部署脚本
```bash
# 使用配置文件部署
./scripts/example.sh
```

### 快速部署脚本（已更新）
```bash
# 基础部署
./scripts/quick-deploy.sh my-project

# 高级部署（包含更多配置）
./scripts/advanced-deploy.sh my-advanced-project
```

## 📁 配置文件示例

### 简单配置
```json
{
  "project": {
    "name": "my-simple-api",
    "template": "api"
  },
  "environment": {
    "NODE_ENV": "production"
  },
  "wrangler": {
    "compatibility_date": "2024-01-01"
  }
}
```

### 完整配置
```json
{
  "project": {
    "name": "my-full-api",
    "template": "api"
  },
  "environment": {
    "NODE_ENV": "production",
    "API_VERSION": "v1",
    "DEBUG": "false"
  },
  "wrangler": {
    "compatibility_date": "2024-01-01",
    "compatibility_flags": ["nodejs_compat"],
    "vars": {
      "CUSTOM_VAR": "custom-value"
    }
  }
}
```

## 🎯 使用场景

### 1. 快速原型开发
```bash
# 生成简单配置
node bin/index.js create-project --generate-config --name "prototype"

# 编辑配置文件，添加需要的资源
# 然后部署
node bin/index.js create-project --config prototype-config.json --deploy
```

### 2. 团队协作
- 将配置文件提交到版本控制
- 团队成员可以快速部署相同配置的项目
- 支持不同环境的配置文件

### 3. CI/CD 集成
```yaml
# GitHub Actions 示例
- name: Deploy with Config
  run: |
    node bin/index.js create-project --config ${{ github.workspace }}/deploy-config.json --deploy
```

### 4. 多环境部署
```bash
# 生产环境
./scripts/config-deploy.sh configs/production.json

# 测试环境
./scripts/config-deploy.sh configs/staging.json
```

## 📊 优势对比

### 之前（命令行参数）
```bash
node bin/index.js create-project \
  --name "my-project" \
  --template api \
  --env-vars "NODE_ENV=production,API_VERSION=v1" \
  --compatibility-date "2024-01-01" \
  --compatibility-flags "nodejs_compat" \
  --deploy
```

### 现在（配置文件）
```bash
# 1. 生成配置
node bin/index.js create-project --generate-config --name "my-project"

# 2. 编辑配置文件（一次性）

# 3. 使用配置部署
node bin/index.js create-project --config my-project-config.json --deploy
```

## ⚠️ 注意事项

1. **配置文件优先级**：使用 `--config` 时，其他命令行参数会被忽略
2. **配置文件验证**：CLI 会验证配置文件的格式和必需字段
3. **路径支持**：支持相对路径和绝对路径
4. **版本控制**：建议将配置文件提交到版本控制，但注意敏感信息

## 🔍 故障排除

### 配置文件错误
```bash
# 检查配置文件格式
cat my-config.json | jq .

# 重新生成配置文件
node bin/index.js create-project --generate-config --name "new-project"
```

### 部署失败
1. 检查 API Token 权限
2. 验证 KV 和 D1 的 ID 是否正确
3. 确保项目名称唯一

## 📞 支持

如果需要添加更多配置选项或修改现有功能，请告知！ 
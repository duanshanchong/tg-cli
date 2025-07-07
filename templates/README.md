# 配置文件模板说明

## 概述

`templates/` 目录包含 Router v7 CLI 使用的配置文件模板。

## 文件说明

### `default-config.json`

这是默认的配置文件模板，用于生成新的项目配置文件。

#### 占位符

- `{{PROJECT_NAME}}` - 项目名称占位符，会在创建项目时自动替换

#### 配置项说明

**project**
- `name` - 项目名称

**environment**
- 环境变量配置，这些变量会在 `wrangler.jsonc` 中设置
- 可以在代码中通过 `env` 对象访问

**wrangler**
- `compatibility_date` - Cloudflare Workers 兼容性日期
- `compatibility_flags` - 兼容性标志数组
- `vars` - 自定义变量，可以在代码中通过 `env` 访问
- `secrets` - 需要设置的密钥变量，部署前需要手动设置

**deploy**
- `auto_deploy` - 是否自动部署
- `environments` - 部署环境列表

## 使用方法

1. **生成配置文件**
   ```bash
   node bin/index.js create-project --generate-config --name "my-project"
   ```

2. **使用配置文件创建项目**
   ```bash
   node bin/index.js create-project --config my-project-config.json
   ```

## 示例

生成的配置文件示例：
```json
{
  "project": {
    "name": "my-api-project"
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
    },
    "secrets": ["DATABASE_URL", "JWT_SECRET"]
  },
  "deploy": {
    "auto_deploy": true,
    "environments": ["production"]
  }
}
``` 
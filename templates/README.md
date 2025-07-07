# 配置文件模板说明

## 概述

`templates/` 目录包含 Router v7 CLI 使用的配置文件模板。

## 文件说明

### `default-config.json`

这是默认的 `wrangler.jsonc` 配置文件模板，用于生成新的项目配置文件。

#### 占位符

- `{{PROJECT_NAME}}` - 项目名称占位符，会在创建项目时自动替换

#### 配置项说明

**基础配置**
- `name` - 项目名称
- `main` - 入口文件路径
- `compatibility_date` - Cloudflare Workers 兼容性日期
- `compatibility_flags` - 兼容性标志数组

**多环境配置 (env)**
- `production` - 生产环境变量
- `staging` - 测试环境变量
- `local` - 本地开发环境变量

## 多环境配置示例

```json
{
  "name": "my-api-project",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "env": {
    "production": {
      "vars": {
        "NODE_ENV": "production",
        "API_VERSION": "v1",
        "DEBUG": "false"
      }
    },
    "staging": {
      "vars": {
        "NODE_ENV": "staging",
        "API_VERSION": "v1",
        "DEBUG": "true"
      }
    },
    "local": {
      "vars": {
        "NODE_ENV": "development",
        "API_VERSION": "v1",
        "DEBUG": "true",
        "MOCK_MODE": "on"
      }
    }
  }
}
```

## 用法说明

### 本地开发环境变量管理

1. **复制本地开发变量模板：**
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. **编辑 .dev.vars 文件，填入你的本地开发变量：**
   ```env
   # .dev.vars
   NODE_ENV=development
   API_VERSION=v1
   DEBUG=true
   MOCK_MODE=on
   LOCAL_API_KEY=your-actual-api-key
   DATABASE_URL=your-local-database-url
   ```

3. **本地开发时自动生效：**
   ```bash
   wrangler dev --env local
   # 或
   npm run dev
   ```

### 环境切换

- 本地开发（使用 .dev.vars 变量）：
  ```bash
  wrangler dev --env local
  ```
- 生产环境：
  ```bash
  wrangler dev --env production
  wrangler deploy --env production
  ```
- 测试环境：
  ```bash
  wrangler dev --env staging
  wrangler deploy --env staging
  ```

## 说明

- 可以根据需要添加更多自定义环境（如 test、preview 等）
- 推荐本地开发时使用 `local` 环境，便于 mock、调试和实验
- 所有环境变量都集中在 `env` 字段下，结构清晰
- **本地开发变量管理：** 使用 `.dev.vars` 文件管理本地开发时的环境变量，该文件不会被提交到仓库
- **团队协作：** 每个开发者可以有自己的 `.dev.vars` 文件，互不影响
- **CI/CD 友好：** 支持环境变量直接配置，无需配置文件 
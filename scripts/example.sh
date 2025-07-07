#!/bin/bash

# 设置环境变量（推荐方式，适合 CI/CD）
export CLOUDFLARE_API_TOKEN="6aP75OWza1eZfVYUxEiMv__SKLOKcXYmQOl_63of"
export CLOUDFLARE_ACCOUNT_ID="ba25b5abf9d8e81ae01deb0222675772"

# 方式1：直接参数化部署（推荐）
node bin/index.js create-project --name my-demo-project --env-vars "NODE_ENV=production,API_VERSION=v1" --deploy

# 方式2：用配置文件部署（如果需要更复杂配置）
# node bin/index.js create-project --generate-config --name my-demo-project
# node bin/index.js create-project --config my-demo-project-config.json --deploy 
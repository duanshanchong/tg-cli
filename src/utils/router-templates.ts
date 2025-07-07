import fs from 'fs';
import path from 'path';
import { RouterV7Config } from '../types';

export class RouterTemplateGenerator {
  /**
   * 生成 Router v7 项目结构
   */
  static async generateProject(projectName: string, config: RouterV7Config): Promise<void> {
    const projectPath = path.join(process.cwd(), projectName);
    
    // 创建项目目录
    if (fs.existsSync(projectPath)) {
      throw new Error(`Project directory ${projectName} already exists`);
    }
    fs.mkdirSync(projectPath, { recursive: true });

    // 生成基础文件
    await this.generatePackageJson(projectPath, config);
    await this.generateWranglerToml(projectPath, config);
    await this.generateTypeScriptConfig(projectPath);
    await this.generateRouterConfig(projectPath, config);
    await this.generateEntryPoint(projectPath, config);
    await this.generateRoutes(projectPath, config);
    await this.generateDevVarsExample(projectPath, config);

    

  }

  private static async generatePackageJson(projectPath: string, config: RouterV7Config): Promise<void> {
    const packageJson = {
      name: config.name,
      version: "1.0.0",
      description: `Router v7 project: ${config.name}`,
      main: "src/index.ts",
      type: "module",
      scripts: {
        "dev": "wrangler dev",
        "deploy": "wrangler deploy",
        "start": "wrangler dev --local",
        "build": "echo 'No build step required for Workers'",
        "type-check": "tsc --noEmit"
      },
      dependencies: {
        "itty-router": "^4.0.0"
      },
      devDependencies: {
        "wrangler": "^4.0.0",
        "typescript": "^5.0.0",
        "@cloudflare/workers-types": "^4.0.0"
      }
    };

    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  private static async generateWranglerToml(projectPath: string, config: RouterV7Config): Promise<void> {
    try {
      // 读取默认配置模板
      const templatePath = path.join(__dirname, '..', '..', 'templates', 'default-config.json');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      
      // 替换项目名称占位符
      const configContent = templateContent.replace(/\{\{PROJECT_NAME\}\}/g, config.name);
      
      // 解析配置
      const wranglerConfig = JSON.parse(configContent);
      
      // 如果有额外的环境变量，合并到生产环境
      if (Object.keys(config.environment).length > 0) {
        if (!wranglerConfig.env.production.vars) {
          wranglerConfig.env.production.vars = {};
        }
        Object.assign(wranglerConfig.env.production.vars, config.environment);
      }
      
      // 如果有额外的 wrangler 配置，合并
      if (config.wrangler?.compatibility_date) {
        wranglerConfig.compatibility_date = config.wrangler.compatibility_date;
      }
      if (config.wrangler?.compatibility_flags) {
        wranglerConfig.compatibility_flags = config.wrangler.compatibility_flags;
      }

      fs.writeFileSync(
        path.join(projectPath, 'wrangler.jsonc'), 
        JSON.stringify(wranglerConfig, null, 2)
      );
    } catch (error) {
      // 如果模板文件不存在或读取失败，使用硬编码的默认配置
      console.warn('Warning: Could not load default config template, using fallback configuration');
      
      const wranglerConfig = {
        name: config.name,
        compatibility_date: config.wrangler?.compatibility_date || "2024-01-01",
        main: "src/index.ts",
        ...(config.wrangler?.compatibility_flags && {
          compatibility_flags: config.wrangler.compatibility_flags
        }),
        env: {
          production: {
            vars: {
              NODE_ENV: "production",
              API_VERSION: "v1",
              DEBUG: "false",
              ...config.environment
            }
          },
          staging: {
            vars: {
              NODE_ENV: "staging",
              API_VERSION: "v1",
              DEBUG: "true",
              ...config.environment
            }
          },
          local: {
            vars: {
              NODE_ENV: "development",
              API_VERSION: "v1",
              DEBUG: "true",
              MOCK_MODE: "on",
              ...config.environment
            }
          }
        }
      };

      fs.writeFileSync(
        path.join(projectPath, 'wrangler.jsonc'), 
        JSON.stringify(wranglerConfig, null, 2)
      );
    }
  }

  private static async generateTypeScriptConfig(projectPath: string): Promise<void> {
    const tsConfig = `{
  "compilerOptions": {
    "target": "es2020",
    "module": "es2020",
    "lib": ["es2020"],
    "strict": true,
    "noEmitOnError": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["./src/**/*"],
  "exclude": ["node_modules"]
}
`;

    fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), tsConfig);
  }

  private static async generateRouterConfig(projectPath: string, config: RouterV7Config): Promise<void> {
    const srcPath = path.join(projectPath, 'src');
    fs.mkdirSync(srcPath, { recursive: true });

    const routerConfig = `import { Router } from 'itty-router';

// 创建路由器实例
export const router = Router();

// CORS 中间件
router.use('*', async (request: Request, env: any, ctx: any) => {
  // 添加 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 继续处理请求
  return router.handle(request, env, ctx);
});
`;

    fs.writeFileSync(path.join(srcPath, 'router.ts'), routerConfig);
  }

  private static async generateEntryPoint(projectPath: string, config: RouterV7Config): Promise<void> {
    const entryPoint = `import { router } from './router';
import './routes/index';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
`;

    fs.writeFileSync(path.join(projectPath, 'src', 'index.ts'), entryPoint);
  }

  private static async generateRoutes(projectPath: string, config: RouterV7Config): Promise<void> {
    const routesPath = path.join(projectPath, 'src', 'routes');
    fs.mkdirSync(routesPath, { recursive: true });

    // 生成路由索引文件
    const routesIndex = `import { router } from '../router';

// 基础路由
router.get('/', () => {
  return new Response(JSON.stringify({
    message: 'Welcome to ${config.name}',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// 健康检查
router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// API 路由
router.get('/api/hello', () => {
  return new Response(JSON.stringify({ message: 'Hello from Router v7!' }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// 导入其他路由模块
// 可以根据需要添加更多路由模块

// 404 错误处理 - 必须在所有路由之后
router.all('*', () => new Response(JSON.stringify({ error: 'Not Found' }), { 
  status: 404,
  headers: { 'Content-Type': 'application/json' }
}));
`;

    fs.writeFileSync(path.join(routesPath, 'index.ts'), routesIndex);


  }

  private static async generateApiRoutes(routesPath: string): Promise<void> {
    const apiRoutes = `import { router } from '../router';

// API 路由
router.get('/api/users', async (request: Request, env: any) => {
  // 这里可以连接数据库
  const users = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' }
  ];
  
  return new Response(JSON.stringify(users), {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.post('/api/users', async (request: Request, env: any) => {
  const userData = await request.json();
  
  // 这里可以保存到数据库
  return new Response(JSON.stringify({ 
    message: 'User created',
    user: userData 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
`;

    fs.writeFileSync(path.join(routesPath, 'api.ts'), apiRoutes);
  }

  private static async generateFullstackRoutes(routesPath: string): Promise<void> {
    const fullstackRoutes = `import { router } from '../router';

// 页面路由
router.get('/dashboard', () => {
  const html = \`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Dashboard</title>
      </head>
      <body>
        <h1>Dashboard</h1>
        <p>Welcome to your Router v7 application!</p>
      </body>
    </html>
  \`;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
});

// API 路由
router.get('/api/data', async (request: Request, env: any) => {
  return new Response(JSON.stringify({ 
    message: 'Fullstack app data' 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
`;

    fs.writeFileSync(path.join(routesPath, 'fullstack.ts'), fullstackRoutes);
  }



  private static async generateDatabaseConfig(projectPath: string): Promise<void> {
    const dbConfig = `// Database configuration
export const dbConfig = {
  // Add your database configuration here
  // Example for D1:
  // binding: 'DB',
  // migrations: './migrations'
};

export async function initDatabase(env: any): Promise<void> {
  // Initialize database connection
  console.log('Database initialized');
}
`;

    fs.writeFileSync(path.join(projectPath, 'src', 'database.ts'), dbConfig);
  }

  private static async generateAuthConfig(projectPath: string): Promise<void> {
    const authConfig = `import { router } from './router';

// Authentication routes
router.post('/auth/login', async (request: Request, env: any) => {
  const { email, password } = await request.json();
  
  // Add your authentication logic here
  return new Response(JSON.stringify({ 
    message: 'Login endpoint',
    email 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.post('/auth/register', async (request: Request, env: any) => {
  const userData = await request.json();
  
  // Add your registration logic here
  return new Response(JSON.stringify({ 
    message: 'Registration endpoint',
    user: userData 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Auth middleware
export function requireAuth(request: Request, env: any): boolean {
  // Add your authentication middleware here
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Authentication required');
  }
  return true;
}
`;

    fs.writeFileSync(path.join(projectPath, 'src', 'auth.ts'), authConfig);
  }

  private static async generateCacheConfig(projectPath: string): Promise<void> {
    const cacheConfig = `// Cache configuration
export const cacheConfig = {
  // Add your cache configuration here
  // Example for KV:
  // binding: 'CACHE',
  // ttl: 3600
};

export async function getCachedData(key: string, env: any): Promise<string | null> {
  // Get data from cache
  return await env.MY_KV.get(key);
}

export async function setCachedData(key: string, value: string, env: any): Promise<void> {
  // Set data in cache
  await env.MY_KV.put(key, value);
}
`;

    fs.writeFileSync(path.join(projectPath, 'src', 'cache.ts'), cacheConfig);
  }

  private static async generateDevVarsExample(projectPath: string, config: RouterV7Config): Promise<void> {
    const devVarsContent = `# Local development environment variables for ${config.name}
# Copy this file to .dev.vars and fill in your local development values
# This file is automatically ignored by git (see .gitignore)

# Common variables (override wrangler.jsonc values for local development)
NODE_ENV=development
API_VERSION=v1
DEBUG=true

# Local development specific variables
MOCK_MODE=on
LOCAL_API_KEY=your-local-api-key
LOCAL_DATABASE_URL=your-local-db-url

# Add your local development variables below
# DATABASE_URL=your-local-database-url
# JWT_SECRET=your-local-jwt-secret
# CUSTOM_VAR=your-local-custom-value
`;

    fs.writeFileSync(path.join(projectPath, '.dev.vars.example'), devVarsContent);
  }
} 
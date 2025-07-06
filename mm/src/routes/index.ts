import { router } from '../router';

// 基础路由
router.get('/', () => {
  return new Response(JSON.stringify({
    message: 'Welcome to mm',
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



// 404 错误处理 - 必须在所有路由之后
router.all('*', () => new Response(JSON.stringify({ error: 'Not Found' }), { 
  status: 404,
  headers: { 'Content-Type': 'application/json' }
}));

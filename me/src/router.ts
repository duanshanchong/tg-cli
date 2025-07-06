import { Router } from 'itty-router';

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

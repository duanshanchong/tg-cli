import { router } from '../router';

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

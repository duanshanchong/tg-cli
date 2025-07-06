import { router } from './router';
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

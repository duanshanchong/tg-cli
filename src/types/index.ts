export interface CloudflareConfig {
  apiToken: string;
  accountId?: string;
}

export interface RouterV7Config {
  name: string;
  template: 'basic' | 'api' | 'fullstack' | 'custom';
  features: {
    database?: boolean;
    auth?: boolean;
    cache?: boolean;
    kv?: boolean;
    r2?: boolean;
  };
  environment: {
    [key: string]: string;
  };
}

export interface AppConfig {
  name: string;
  template?: string;
  routes?: RouteConfig[];
  environment?: Record<string, string>;
}

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;
  auth?: boolean;
  cors?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  result: T;
  errors?: any[];
  messages?: any[];
}

export interface CloudflareApp {
  id: string;
  name?: string;
  created_on: string;
  modified_on: string;
  usage_model: string;
  script?: string;
  tag?: string;
  handlers?: string[];
  compatibility_date?: string;
  last_deployed_from?: string;
}

export interface RouterV7Project {
  name: string;
  config: RouterV7Config;
  cloudflareWorker?: CloudflareApp;
  localPath: string;
} 
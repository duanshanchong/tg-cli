import { CloudflareApp, ApiResponse } from '../types';

interface CloudflareAccount {
  id: string;
  name: string;
}

export class CloudflareApi {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async getAccounts(): Promise<CloudflareAccount[]> {
    const res = await fetch('https://api.cloudflare.com/client/v4/accounts', {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json() as ApiResponse<CloudflareAccount[]>;
    if (!data.success) throw new Error(JSON.stringify(data.errors));
    return data.result;
  }

  async getAccountId(): Promise<string> {
    const accounts = await this.getAccounts();
    
    if (accounts.length === 0) {
      throw new Error('No accounts found. Please check your API token permissions.');
    }
    
    if (accounts.length === 1) {
      return accounts[0].id;
    }
    
    // 如果有多个账户，返回第一个（可以后续改进为让用户选择）
    console.log(`Found ${accounts.length} accounts, using: ${accounts[0].name} (${accounts[0].id})`);
    return accounts[0].id;
  }

  async getWorkers(accountId: string): Promise<CloudflareApp[]> {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await res.json() as ApiResponse<CloudflareApp[]>;
    if (!data.success) throw new Error(JSON.stringify(data.errors));
    return data.result;
  }

  async getAccountSubdomain(accountId: string): Promise<string> {
    const res = await fetch(
      'https://api.cloudflare.com/client/v4/zones',
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await res.json() as ApiResponse<any[]>;
    if (!data.success) throw new Error(JSON.stringify(data.errors));
    
    // Extract subdomain from the first zone name
    if (data.result && data.result.length > 0) {
      const zoneName = data.result[0].name;
      // Extract subdomain from zone name (e.g., "keepwatch.cn" -> "keepwatch")
      const subdomain = zoneName.split('.')[0];
      return subdomain;
    }
    
    return 'workers'; // fallback
  }
}

// 保持向后兼容的函数
export async function getAccounts(apiToken: string): Promise<CloudflareAccount[]> {
  const api = new CloudflareApi(apiToken);
  return api.getAccounts();
}

export async function getAccountId(apiToken: string): Promise<string> {
  const api = new CloudflareApi(apiToken);
  return api.getAccountId();
}

export async function listAllWorkers(): Promise<CloudflareApp[]> {
  const { ConfigManager } = await import('../utils/config-manager');
  const config = ConfigManager.getConfig();
  if (!config?.apiToken) {
    throw new Error('请先运行 router-cli config 配置 API Token');
  }

  // 自动获取 Account ID
  const accountId = config.accountId || await getAccountId(config.apiToken);
  
  const api = new CloudflareApi(config.apiToken);
  return api.getWorkers(accountId);
} 
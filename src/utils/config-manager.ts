import fs from 'fs';
import os from 'os';
import path from 'path';
import { CloudflareConfig } from '../types';

const CONFIG_PATH = path.join(os.homedir(), '.router-cli', 'config.json');

/**
 * 检查是否已通过 wrangler login 认证
 */
async function checkWranglerLogin(): Promise<boolean> {
  try {
    // 检查 wrangler 配置文件是否存在（macOS 路径）
    const wranglerConfigPath = path.join(os.homedir(), 'Library', 'Preferences', '.wrangler', 'config', 'default.toml');
    if (fs.existsSync(wranglerConfigPath)) {
      return true;
    }
    
    // 检查 Linux/Windows 路径
    const alternativePath = path.join(os.homedir(), '.wrangler', 'config', 'default.toml');
    return fs.existsSync(alternativePath);
  } catch (error) {
    return false;
  }
}

export class ConfigManager {
  static saveConfig(config: CloudflareConfig): void {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  }

  static getConfig(): CloudflareConfig | null {
    // 优先读取环境变量
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (apiToken) {
      return { apiToken, accountId };
    }
    // 否则读本地配置文件
    if (!fs.existsSync(CONFIG_PATH)) return null;
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  }

  static async isConfigured(): Promise<boolean> {
    const config = this.getConfig();
    const hasApiToken = !!(config?.apiToken);
    const hasWranglerLogin = await checkWranglerLogin();
    return hasApiToken || hasWranglerLogin;
  }

  static async getConfigOrThrow(): Promise<CloudflareConfig> {
    const config = this.getConfig();
    if (!config) {
      throw new Error('Not configured. Please run "router-cli config" first.');
    }
    return config;
  }
} 
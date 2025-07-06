import fs from 'fs';
import os from 'os';
import path from 'path';
import { CloudflareConfig } from '../types';

const CONFIG_PATH = path.join(os.homedir(), '.router-cli', 'config.json');

export class ConfigManager {
  static saveConfig(config: CloudflareConfig): void {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  }

  static getConfig(): CloudflareConfig | null {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  }

  static async isConfigured(): Promise<boolean> {
    const config = this.getConfig();
    return !!(config?.apiToken);
  }

  static async getConfigOrThrow(): Promise<CloudflareConfig> {
    const config = this.getConfig();
    if (!config) {
      throw new Error('Not configured. Please run "router-cli config" first.');
    }
    return config;
  }
} 
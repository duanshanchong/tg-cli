import { spawn } from 'child_process';
import { CloudflareApp } from '../types';
import { ConfigManager } from './config-manager';
import fs from 'fs';
import path from 'path';

export class WranglerManager {
  /**
   * 执行 wrangler 命令（使用 API Token）
   */
  private async executeWrangler(args: string[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const config = ConfigManager.getConfig();
      if (!config?.apiToken) {
        reject(new Error('API Token not configured. Please run "router-cli config" first.'));
        return;
      }

      const env = { 
        ...process.env,
        CLOUDFLARE_API_TOKEN: config.apiToken
      };

      const child = spawn('npx', ['wrangler', ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Wrangler command failed: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to execute wrangler: ${error.message}`));
      });
    });
  }

  /**
   * 检查是否已配置 API Token
   */
  async isConfigured(): Promise<boolean> {
    return await ConfigManager.isConfigured();
  }

  /**
   * 创建新的 Worker 项目
   */
  async createProject(name: string): Promise<void> {
    try {
      await this.executeWrangler(['init', name, '--yes']);
    } catch (error) {
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 部署 Worker
   */
  async deploy(projectName: string, environment: string = 'production'): Promise<string> {
    const args = ['deploy'];
    
    // 总是指定环境参数
    args.push('--env', environment);

    try {
      // 切换到项目目录
      const projectPath = path.join(process.cwd(), projectName);
      if (!fs.existsSync(projectPath)) {
        throw new Error(`Project directory ${projectName} not found`);
      }

      // 在项目目录中运行 wrangler
      const config = ConfigManager.getConfig();
      
      // 检查是否已经有 OAuth Token 登录
      const env = { ...process.env };
      
      // 在非交互式环境中，直接使用 API Token
      if (!config?.apiToken) {
        throw new Error('API Token not configured. Please run "router-cli config" first.');
      }
      console.log('Using API Token for authentication');
      env.CLOUDFLARE_API_TOKEN = config.apiToken;

      // 先安装依赖
      await this.installDependencies(projectPath, env);

      return new Promise((resolve, reject) => {
        const child = spawn('npx', ['wrangler', ...args], {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
          env,
          cwd: projectPath
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0) {
            resolve(stdout);
          } else {
            console.error('Wrangler deployment failed:');
            console.error('Exit code:', code);
            console.error('stdout:', stdout);
            console.error('stderr:', stderr);
            reject(new Error(`Wrangler command failed with code ${code}: ${stderr || 'No error output'}`));
          }
        });

        child.on('error', (error) => {
          reject(new Error(`Failed to execute wrangler: ${error.message}`));
        });
      });
    } catch (error) {
      throw new Error(`Deploy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 安装项目依赖
   */
  private async installDependencies(projectPath: string, env: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['install'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env,
        cwd: projectPath
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to execute npm install: ${error.message}`));
      });
    });
  }

  /**
   * 列出当前项目的 Workers（如果有 wrangler.toml）
   */
  async listCurrentWorkers(): Promise<CloudflareApp[]> {
    try {
      const output = await this.executeWrangler(['deployments', 'list']);
      
      // 解析输出，提取 worker 名称
      const lines = output.trim().split('\n');
      const workers: CloudflareApp[] = [];
      
      for (const line of lines) {
        if (line.includes('Active') || line.includes('Deployed')) {
          const parts = line.split(/\s+/);
          if (parts.length > 0) {
            const name = parts[0];
            workers.push({
              id: name,
              name: name,
              created_on: new Date().toISOString(),
              modified_on: new Date().toISOString(),
              usage_model: 'bundled'
            });
          }
        }
      }
      
      return workers;
    } catch (error) {
      // 如果当前目录没有 wrangler.toml，返回空数组
      return [];
    }
  }

  /**
   * 删除 Worker
   */
  async deleteWorker(name: string): Promise<void> {
    try {
      await this.executeWrangler(['delete', name]);
    } catch (error) {
      throw new Error(`Failed to delete worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取 Worker 信息
   */
  async getWorkerInfo(name: string): Promise<any> {
    try {
      const output = await this.executeWrangler(['secret', 'list', '--name', name]);
      return { name, secrets: output };
    } catch (error) {
      throw new Error(`Failed to get worker info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 设置环境变量
   */
  async setSecret(name: string, key: string, value: string): Promise<void> {
    try {
      await this.executeWrangler(['secret', 'put', key, '--name', name]);
    } catch (error) {
      throw new Error(`Failed to set secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 
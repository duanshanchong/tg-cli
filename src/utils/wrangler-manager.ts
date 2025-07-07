import { spawn } from 'child_process';
import { CloudflareApp } from '../types';
import { ConfigManager } from './config-manager';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export class WranglerManager {
  /**
   * 执行 wrangler 命令（使用 API Token）
   */
  private async executeWrangler(args: string[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const config = ConfigManager.getConfig();
      // 只在有 token 时才设置环境变量
      const env = { ...process.env };
      if (config?.apiToken) {
        env.CLOUDFLARE_API_TOKEN = config.apiToken;
      }

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
      const env = { ...process.env };
      if (config?.apiToken) {
        env.CLOUDFLARE_API_TOKEN = config.apiToken;
        console.log('Using API Token for authentication');
      } else {
        console.log('No API Token found, will use wrangler login (OAuth) if available');
      }

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
          const output = data.toString();
          stdout += output;
          // 实时显示关键信息
          if (output.includes('Deployed to') || output.includes('deployed to') || output.includes('URL:') || output.includes('https://')) {
            console.log(chalk.gray(output.trim()));
          }
        });

        child.stderr?.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          // 显示警告信息，但不作为错误
          if (!output.includes('Error') && !output.includes('error')) {
            console.log(chalk.yellow(output.trim()));
          }
        });

        child.on('close', (code) => {
          if (code === 0) {
            // 尝试从输出中提取更多信息
            const enhancedOutput = this.enhanceDeployOutput(stdout, projectName, environment);
            resolve(enhancedOutput);
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
   * 增强部署输出信息
   */
  private enhanceDeployOutput(stdout: string, projectName: string, environment: string): string {
    let enhancedOutput = stdout;
    const urlMatch = stdout.match(/URL:\s*(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      enhancedOutput = enhancedOutput.replace(urlMatch[0], chalk.green(urlMatch[1]));
    }
    const deployedMatch = stdout.match(/Deployed to\s*(https?:\/\/[^\s]+)/);
    if (deployedMatch) {
      enhancedOutput = enhancedOutput.replace(deployedMatch[0], chalk.green(deployedMatch[1]));
    }
    return enhancedOutput;
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
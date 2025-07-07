import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { CloudflareApi } from '../utils/cloudflare-api';
import { ConfigManager } from '../utils/config-manager';
import { CloudflareApp } from '../types';
import path from 'path';
import fs from 'fs';

/**
 * 检查是否已通过 wrangler login 认证
 */
async function checkWranglerLogin(): Promise<boolean> {
  try {
    // 检查 wrangler 配置文件是否存在（macOS 路径）
    const wranglerConfigPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Library', 'Preferences', '.wrangler', 'config', 'default.toml');
    if (fs.existsSync(wranglerConfigPath)) {
      return true;
    }
    
    // 检查 Linux/Windows 路径
    const alternativePath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.wrangler', 'config', 'default.toml');
    return fs.existsSync(alternativePath);
  } catch (error) {
    return false;
  }
}

export const listAll = new Command('list-all')
  .description('List all Router v7 projects deployed on Cloudflare')
  .option('-a, --account <account>', 'Cloudflare Account ID')
  .action(async (options) => {
    // 1. 先检查配置和参数，不要先 spinner
    const config = ConfigManager.getConfig();
    const hasApiToken = config?.apiToken;
    const hasWranglerLogin = await checkWranglerLogin();
    
    if (!hasApiToken && !hasWranglerLogin) {
      console.log(chalk.red('No authentication configured. Please run "router-cli config" first.'));
      return;
    }

    // 2. 真正开始拉取数据时才显示 loading
    const spinner = ora('Fetching Router v7 projects...').start();
    try {
      spinner.text = 'Fetching Workers...';
      let workers: CloudflareApp[] = [];
      let subdomain = 'workers';

      // 优先使用 Wrangler login，如果有的话
      if (hasWranglerLogin) {
        // 用 wrangler CLI 获取 Account ID
        spinner.text = 'Getting Account ID from wrangler...';
        const { execSync } = require('child_process');
        
        try {
          // 获取 Account ID
          const whoamiOutput = execSync('npx wrangler whoami', { encoding: 'utf8' });
          const accountIdMatch = whoamiOutput.match(/│\s*([a-f0-9]{32})\s*│/);
          const accountId = accountIdMatch ? accountIdMatch[1] : null;
          
          if (!accountId) {
            spinner.fail('Could not extract Account ID from wrangler whoami output');
            return;
          }
          
          console.log(chalk.gray(`Auto-detected Account ID: ${accountId}`));
          
          // 如果有 API Token，使用 Cloudflare API
          if (hasApiToken && config?.apiToken) {
            spinner.text = 'Fetching Workers from Cloudflare API...';
            const cloudflareApi = new CloudflareApi(config.apiToken);
            [workers, subdomain] = await Promise.all([
              cloudflareApi.getWorkers(accountId),
              cloudflareApi.getAccountSubdomain(accountId)
            ]);
          } else {
            // 如果没有 API Token，提示用户
            spinner.fail('API Token required for listing workers. Please run "router-cli config" and provide an API Token.');
            console.log(chalk.yellow('\nNote: Wrangler login (OAuth) is only supported for deployment operations.'));
            console.log(chalk.yellow('For listing workers, you need to provide an API Token.'));
            return;
          }
        } catch (wranglerError: any) {
          spinner.fail(`Failed to get Account ID from wrangler: ${wranglerError.message}`);
          console.error(chalk.red(wranglerError));
          return;
        }
      } else if (hasApiToken) {
        // 用 Cloudflare API
        const accountId = options.account || config?.accountId;
        if (!accountId) {
          spinner.fail('Account ID not configured. Please run "router-cli config" first.');
          return;
        }
        const cloudflareApi = new CloudflareApi(config.apiToken);
        [workers, subdomain] = await Promise.all([
          cloudflareApi.getWorkers(accountId),
          cloudflareApi.getAccountSubdomain(accountId)
        ]);
      }

      spinner.succeed(`Found ${workers.length} Workers`);

      if (workers.length === 0) {
        console.log(chalk.yellow('\nNo Workers found. Create your first Router v7 project:'));
        console.log(chalk.cyan('  router-cli create-project'));
        return;
      }

      // 显示 Workers 列表
      console.log(chalk.green('\n🚀 Your Router v7 projects:'));
      console.log(chalk.gray('─'.repeat(80)));

      workers.forEach((worker: CloudflareApp, index: number) => {
        const workerName = worker.name || worker.id;
        const status = worker.handlers && worker.handlers.includes('fetch') ? chalk.green('● Active') : chalk.yellow('○ Inactive');
        
        // 优化URL生成逻辑
        const url = generateWorkerUrl(workerName, subdomain);
        
        console.log(chalk.cyan(`${index + 1}. ${chalk.bold(workerName)}`));
        console.log(chalk.gray(`   Status: ${status}`));
        console.log(chalk.gray(`   URL: ${chalk.underline(url)}`));
        console.log(chalk.gray(`   Created: ${new Date(worker.created_on).toLocaleDateString()}`));
        console.log(chalk.gray(`   Modified: ${new Date(worker.modified_on).toLocaleDateString()}`));
        
        // 添加快速访问提示
        console.log(chalk.blue(`   🔗 Quick test: curl ${url}/health`));
        console.log('');
      });

      console.log(chalk.green('📋 Quick actions:'));
      console.log(chalk.cyan('  router-cli create-project    # Create a new project'));
      console.log(chalk.cyan('  router-cli deploy            # Deploy current project'));
      console.log(chalk.cyan('  router-cli delete-worker     # Delete a worker'));

    } catch (error: any) {
      spinner.fail(`Failed to fetch projects: ${error.message}`);
      console.error(chalk.red(error));
    }
  });

/**
 * 生成Worker的访问URL
 */
function generateWorkerUrl(workerName: string, subdomain: string): string {
  // 如果worker名称包含子域名，直接使用
  if (workerName.includes('.')) {
    return `https://${workerName}`;
  }
  
  // 否则使用标准格式
  return `https://${workerName}.${subdomain}.workers.dev`;
} 
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { CloudflareApi } from '../utils/cloudflare-api';
import { ConfigManager } from '../utils/config-manager';
import { CloudflareApp } from '../types';

export const listAll = new Command('list-all')
  .description('List all Router v7 projects deployed on Cloudflare')
  .option('-a, --account <account>', 'Cloudflare Account ID')
  .action(async (options) => {
    // 1. 先检查配置和参数，不要先 spinner
    const config = ConfigManager.getConfig();
    if (!config?.apiToken) {
      console.log(chalk.red('API Token not configured. Please run "router-cli config" first.'));
      return;
    }

    const accountId = options.account || config.accountId;
    if (!accountId) {
      console.log(chalk.red('Account ID not configured. Please run "router-cli config" first.'));
      return;
    }

    // 2. 真正开始拉取数据时才显示 loading
    const spinner = ora('Fetching Router v7 projects...').start();
    try {
      spinner.text = 'Fetching Workers from Cloudflare...';

      // 获取所有 Workers 和账户子域名
      const cloudflareApi = new CloudflareApi(config.apiToken);
      const [workers, subdomain] = await Promise.all([
        cloudflareApi.getWorkers(accountId),
        cloudflareApi.getAccountSubdomain(accountId)
      ]);

      spinner.succeed(`Found ${workers.length} Workers`);

      if (workers.length === 0) {
        console.log(chalk.yellow('\nNo Workers found. Create your first Router v7 project:'));
        console.log(chalk.cyan('  router-cli create-project'));
        return;
      }

      // 显示 Workers 列表
      console.log(chalk.green('\nYour Router v7 projects:'));
      console.log(chalk.gray('─'.repeat(80)));

      workers.forEach((worker: CloudflareApp, index: number) => {
        const workerName = worker.name || worker.id;
        const status = worker.handlers && worker.handlers.includes('fetch') ? chalk.green('● Active') : chalk.yellow('○ Inactive');
        const url = `https://${workerName}.${subdomain}.workers.dev`;
        
        console.log(chalk.cyan(`${index + 1}. ${workerName}`));
        console.log(chalk.gray(`   Status: ${status}`));
        console.log(chalk.gray(`   URL: ${url}`));
        console.log(chalk.gray(`   Created: ${new Date(worker.created_on).toLocaleDateString()}`));
        console.log(chalk.gray(`   Modified: ${new Date(worker.modified_on).toLocaleDateString()}`));
        console.log('');
      });

      console.log(chalk.green('Quick actions:'));
      console.log(chalk.cyan('  router-cli create-project    # Create a new project'));
      console.log(chalk.cyan('  router-cli deploy            # Deploy current project'));

    } catch (error: any) {
      spinner.fail(`Failed to fetch projects: ${error.message}`);
      console.error(chalk.red(error));
    }
  }); 
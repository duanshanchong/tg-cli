import { Command } from 'commander';
import { prompt } from 'enquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../utils/config-manager';
import { CloudflareApi } from '../utils/cloudflare-api';

export const config = new Command('config')
  .description('Configure Router v7 CLI with Cloudflare credentials')
  .option('-t, --token <token>', 'Cloudflare API Token')
  .option('-a, --account <account>', 'Cloudflare Account ID')
  .action(async (options) => {
    let apiToken = options.token;
    let accountId = options.account;

    // 1. 一开始就提示输入 Token
    if (!apiToken) {
      console.log(chalk.yellow('\n请直接粘贴你的 Cloudflare API Token 并回车：'));
      const tokenResponse = await prompt<{ token: string }>({
        type: 'input',
        name: 'token',
        message: 'Enter your Cloudflare API Token:',
        validate: (value: string) => {
          if (!value) return 'API Token is required';
          return true;
        }
      });
      apiToken = tokenResponse.token;
    }

    if (!accountId) {
      const accountResponse = await prompt<{ account: string }>({
        type: 'input',
        name: 'account',
        message: 'Enter your Cloudflare Account ID (optional - will auto-detect if not provided):',
      });
      accountId = accountResponse.account;
    }

    // 2. 用户输入完后再显示 loading
    const spinner = ora('Configuring Router v7 CLI...').start();
    try {
      // 验证 API Token 和获取 Account ID
      const cloudflareApi = new CloudflareApi(apiToken);
      let validatedAccountId = accountId;

      if (!validatedAccountId) {
        try {
          const accounts = await cloudflareApi.getAccounts();
          if (accounts.length > 0) {
            validatedAccountId = accounts[0].id;
            console.log(chalk.cyan(`Auto-detected Account ID: ${validatedAccountId}`));
          } else {
            throw new Error('No accounts found for this API Token');
          }
        } catch (error: any) {
          spinner.fail('Failed to auto-detect Account ID. Please provide it manually.');
          console.error(chalk.red(error.message));
          return;
        }
      }

      // 保存配置
      const config = {
        apiToken,
        accountId: validatedAccountId
      };

      ConfigManager.saveConfig(config);

      spinner.succeed('Router v7 CLI configured successfully!');
      
      console.log(chalk.green('\nConfiguration saved:'));
      console.log(chalk.cyan(`  Account ID: ${validatedAccountId}`));
      console.log(chalk.cyan(`  API Token: ${apiToken.substring(0, 8)}...`));
      
      console.log(chalk.green('\nYou can now:'));
      console.log(chalk.cyan('  router-cli create-project    # Create a new Router v7 project'));
      console.log(chalk.cyan('  router-cli deploy            # Deploy your project'));
      console.log(chalk.cyan('  router-cli list-all          # List all your Workers'));

    } catch (error: any) {
      spinner.fail(`Configuration failed: ${error.message}`);
      console.error(chalk.red(error));
    }
  }); 
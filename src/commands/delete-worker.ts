import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { WranglerManager } from '../utils/wrangler-manager';
import { ConfigManager } from '../utils/config-manager';
import { prompt } from 'enquirer';
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

export const deleteWorker = new Command('delete-worker')
  .description('Delete a deployed Worker by name')
  .argument('[name]', 'Worker name to delete (e.g. my-app-prod)')
  .option('--no-confirm', 'Skip confirmation prompt')
  .action(async (name, options) => {
    // 自动检测是否为非交互式模式
    const isNonInteractive = !!name;
    
    // 检查配置 - 支持两种认证方式
    const config = ConfigManager.getConfig();
    const hasApiToken = config?.apiToken;
    const hasWranglerLogin = await checkWranglerLogin();
    
    if (!hasApiToken && !hasWranglerLogin) {
      console.log(chalk.red('No authentication configured. Please run "router-cli config" first.'));
      return;
    }

    // 交互式输入 worker 名称
    let workerName = name;
    if (!workerName) {
      if (isNonInteractive) {
        console.error(chalk.red('Error: Worker name is required in non-interactive mode. Use --name option.'));
        process.exit(1);
      }
      
      const resp = await prompt<{ name: string }>({
        type: 'input',
        name: 'name',
        message: 'Enter the Worker name to delete:',
        validate: (v: string) => v ? true : 'Worker name is required'
      });
      workerName = resp.name;
    }

    // 确认删除
    if (!options.confirm && !isNonInteractive) {
      const { confirm } = await prompt<{ confirm: boolean }>({
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete Worker "${workerName}"?`,
        initial: false
      });
      
      if (!confirm) {
        console.log(chalk.yellow('Deletion cancelled.'));
        return;
      }
    }

    const spinner = ora(`Deleting Worker: ${workerName} ...`).start();
    try {
      const wrangler = new WranglerManager();
      await wrangler.deleteWorker(workerName);
      spinner.succeed(`Worker ${workerName} deleted successfully!`);
      
      // 自动刷新 list-all
      if (!isNonInteractive) {
        console.log(chalk.gray('\nCurrent Workers:'));
        const { listAll } = await import('./list-all');
        await listAll.parseAsync([]);
      }
    } catch (error: any) {
      spinner.fail(`Failed to delete Worker: ${error.message}`);
      console.error(chalk.red(error));
    }
  }); 
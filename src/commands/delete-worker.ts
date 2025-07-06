import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { WranglerManager } from '../utils/wrangler-manager';
import { ConfigManager } from '../utils/config-manager';
import { prompt } from 'enquirer';

export const deleteWorker = new Command('delete-worker')
  .description('Delete a deployed Worker by name')
  .argument('[name]', 'Worker name to delete (e.g. my-app-prod)')
  .action(async (name) => {
    // 检查配置
    const config = ConfigManager.getConfig();
    if (!config?.apiToken) {
      console.log(chalk.red('API Token not configured. Please run "router-cli config" first.'));
      return;
    }

    // 交互式输入 worker 名称
    let workerName = name;
    if (!workerName) {
      const resp = await prompt<{ name: string }>({
        type: 'input',
        name: 'name',
        message: 'Enter the Worker name to delete:',
        validate: (v: string) => v ? true : 'Worker name is required'
      });
      workerName = resp.name;
    }

    const spinner = ora(`Deleting Worker: ${workerName} ...`).start();
    try {
      const wrangler = new WranglerManager();
      await wrangler.deleteWorker(workerName);
      spinner.succeed(`Worker ${workerName} deleted successfully!`);
      // 自动刷新 list-all
      console.log(chalk.gray('\nCurrent Workers:'));
      const { listAll } = await import('./list-all');
      await listAll.parseAsync([]);
    } catch (error: any) {
      spinner.fail(`Failed to delete Worker: ${error.message}`);
      console.error(chalk.red(error));
    }
  }); 
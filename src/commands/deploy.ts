import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { WranglerManager } from '../utils/wrangler-manager';
import { ConfigManager } from '../utils/config-manager';

export const deploy = new Command('deploy')
  .description('Deploy Router v7 project to Cloudflare Workers')
  .argument('[project]', 'Project name (defaults to current directory name)')
  .option('-e, --env <environment>', 'Environment (production, staging)', 'production')
  .action(async (project, options) => {
    // 1. 先检查参数和项目目录，不要先 spinner
    // 检查配置
    const config = ConfigManager.getConfig();
    if (!config?.apiToken) {
      console.log(chalk.red('API Token not configured. Please run "router-cli config" first.'));
      return;
    }

    // 确定项目名称和路径
    const projectName = project || process.cwd().split('/').pop();
    if (!projectName) {
      console.log(chalk.red('Could not determine project name. Please specify project name as argument.'));
      return;
    }

    // 检查项目目录是否存在
    const projectPath = path.join(process.cwd(), projectName);
    if (!fs.existsSync(projectPath)) {
      console.log(chalk.red(`Project directory "${projectName}" not found at ${projectPath}`));
      return;
    }

    // 2. 真正开始部署时才显示 loading
    const spinner = ora(`Deploying ${projectName} to ${options.env}...`).start();
    try {
      // 部署项目
      const wrangler = new WranglerManager();
      const deployOutput = await wrangler.deploy(projectName, options.env);

      spinner.succeed(`Project ${projectName} deployed successfully to ${options.env}!`);
      
      // 从部署输出中提取 URL
      const urlMatch = deployOutput.match(/https:\/\/[\S]+\.workers\.dev/);
      const baseUrl = urlMatch ? urlMatch[0] : `https://${projectName}-${options.env}.workers.dev`;
      
      console.log(chalk.green(`\nYour app is now live at: ${baseUrl}`));
      console.log(chalk.cyan(`\nAvailable endpoints:`));
      console.log(chalk.cyan(`  GET  ${baseUrl}/`));
      console.log(chalk.cyan(`  GET  ${baseUrl}/health`));
      console.log(chalk.cyan(`  GET  ${baseUrl}/api/hello`));

    } catch (error: any) {
      spinner.fail(`Deployment failed: ${error.message}`);
      console.error(chalk.red(error));
    }
  }); 
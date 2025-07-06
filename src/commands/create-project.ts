import { Command } from 'commander';
import { prompt } from 'enquirer';
import chalk from 'chalk';
import ora from 'ora';
import { RouterTemplateGenerator } from '../utils/router-templates';
import { ConfigManager } from '../utils/config-manager';
import { WranglerManager } from '../utils/wrangler-manager';
import { RouterV7Config } from '../types';

export const createProject = new Command('create-project')
  .description('Create a new Router v7 project with Cloudflare Workers')
  .option('-n, --name <name>', 'Project name')
  .option('-t, --template <template>', 'Project template (basic, api, fullstack, custom)')
  .action(async (options) => {
    // 1. 一开始就提示输入项
    const projectConfig = await getProjectConfig(options);

    // 2. 用户输入完后再显示 loading
    const spinner = ora('Creating Router v7 project...').start();
    try {
      // 检查配置
      const config = ConfigManager.getConfig();
      if (!config?.apiToken) {
        spinner.fail('API Token not configured. Please run "router-cli config" first.');
        return;
      }

      spinner.text = `Creating project: ${projectConfig.name}`;
      // 生成项目文件
      await RouterTemplateGenerator.generateProject(projectConfig.name, projectConfig);
      spinner.succeed(`Project ${projectConfig.name} created successfully!`);

      // 显示后续步骤
      console.log(chalk.green('\nNext steps:'));
      console.log(chalk.cyan(`  cd ${projectConfig.name}`));
      console.log(chalk.cyan('  npm install'));
      console.log(chalk.cyan('  router-cli deploy'));

      // 询问是否立即部署
      const { deployNow } = await prompt<{ deployNow: boolean }>({
        type: 'confirm',
        name: 'deployNow',
        message: 'Would you like to deploy this project to Cloudflare now?',
        initial: false
      });

      if (deployNow) {
        spinner.text = 'Deploying to Cloudflare...';
        spinner.start();
        const wrangler = new WranglerManager();
        await wrangler.deploy(projectConfig.name);
        spinner.succeed('Project deployed successfully!');
        // 这里的 URL 逻辑建议后续也优化为自动提取
        console.log(chalk.green(`\nYour app is now live at: https://${projectConfig.name}.${config?.accountId}.workers.dev`));
      }

    } catch (error: any) {
      spinner.fail(`Failed to create project: ${error.message}`);
      console.error(chalk.red(error));
    }
  });

async function getProjectConfig(options: any): Promise<RouterV7Config> {
  let name = options.name;
  let template = options.template;

  // 如果没有通过命令行参数提供，则通过交互式提示获取
  if (!name) {
    const nameResponse = await prompt<{ name: string }>({
      type: 'input',
      name: 'name',
      message: 'What is your project name?',
      validate: (value: string) => {
        if (!value) return 'Project name is required';
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Project name must contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      }
    });
    name = nameResponse.name;
  }

  if (!template) {
    const templateResponse = await prompt<{ template: string }>({
      type: 'select',
      name: 'template',
      message: 'Choose a project template:',
      choices: [
        { name: 'basic', message: 'Basic - Simple router with basic routes' },
        { name: 'api', message: 'API - RESTful API with CRUD operations' },
        { name: 'fullstack', message: 'Fullstack - API + HTML pages' },
        { name: 'custom', message: 'Custom - Minimal template for custom setup' }
      ]
    });
    template = templateResponse.template;
  }

  // 获取项目特性
  const featuresResponse = await prompt<{ features: string[] }>({
    type: 'multiselect',
    name: 'features',
    message: 'Select additional features:',
    choices: [
      { name: 'database', message: 'Database (D1/KV)' },
      { name: 'auth', message: 'Authentication' },
      { name: 'cache', message: 'Caching (KV)' },
      { name: 'kv', message: 'KV Storage' },
      { name: 'r2', message: 'R2 Object Storage' }
    ]
  });

  // 获取环境变量
  const envResponse = await prompt<{ envVars: string }>({
    type: 'input',
    name: 'envVars',
    message: 'Enter environment variables (format: KEY1=value1,KEY2=value2)',
    initial: 'NODE_ENV=production'
  });

  const environment: Record<string, string> = {};
  if (envResponse.envVars) {
    envResponse.envVars.split(',').forEach(pair => {
      const [key, value] = pair.trim().split('=');
      if (key && value) {
        environment[key.trim()] = value.trim();
      }
    });
  }

  return {
    name,
    template: template as 'basic' | 'api' | 'fullstack' | 'custom',
    features: {
      database: featuresResponse.features.includes('database'),
      auth: featuresResponse.features.includes('auth'),
      cache: featuresResponse.features.includes('cache'),
      kv: featuresResponse.features.includes('kv'),
      r2: featuresResponse.features.includes('r2')
    },
    environment
  };
} 
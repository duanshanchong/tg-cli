import { Command } from 'commander';
import { prompt } from 'enquirer';
import chalk from 'chalk';
import ora from 'ora';
import { RouterTemplateGenerator } from '../utils/router-templates';
import { ConfigManager } from '../utils/config-manager';
import { WranglerManager } from '../utils/wrangler-manager';
import { ConfigFileManager } from '../utils/config-file-manager';
import { RouterV7Config } from '../types';
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

export const createProject = new Command('create-project')
  .description('Create a new Router v7 project with Cloudflare Workers')
  .option('-n, --name <name>', 'Project name')
  .option('--env-vars <vars>', 'Environment variables (format: KEY1=value1,KEY2=value2)')
  .option('--compatibility-date <date>', 'Compatibility date (default: 2024-01-01)')
  .option('--compatibility-flags <flags>', 'Compatibility flags (format: flag1,flag2)')
  .option('--config <file>', 'Configuration file path (JSON format)')
  .option('--generate-config', 'Generate a configuration file template')
  .option('--deploy', 'Deploy immediately after creation')
  .action(async (options) => {
    // 处理配置文件生成
    if (options.generateConfig) {
      const projectName = options.name || 'my-project';
      const config = ConfigFileManager.createDefaultConfig(projectName);
      const configPath = ConfigFileManager.getConfigPath(projectName);
      ConfigFileManager.saveConfigFile(config, configPath);
      console.log(chalk.green(`✓ Configuration file generated: ${configPath}`));
      console.log(chalk.cyan('Edit the file and run: router-cli create-project --config <file>'));
      return;
    }

    // 自动检测是否为非交互式模式
    const isNonInteractive = !!(options.name || options.template || options.features || options.envVars || options.config);
    
    // 1. 获取项目配置
    const projectConfig = await getProjectConfig(options);

    // 2. 用户输入完后再显示 loading
    const spinner = ora('Creating Router v7 project...').start();
    try {
      // 检查配置 - 支持两种认证方式
      const config = ConfigManager.getConfig();
      const hasApiToken = config?.apiToken;
      const hasWranglerLogin = await checkWranglerLogin();
      
      if (!hasApiToken && !hasWranglerLogin) {
        spinner.fail('No authentication configured. Please run "router-cli config" first.');
        return;
      }

      spinner.text = `Creating project: ${projectConfig.name}`;
      // 生成项目文件
      await RouterTemplateGenerator.generateProject(projectConfig.name, projectConfig);
      spinner.succeed(`Project ${projectConfig.name} created successfully!`);

      // 显示后续步骤
      if (!isNonInteractive) {
        console.log(chalk.green('\nNext steps:'));
        console.log(chalk.cyan(`  cd ${projectConfig.name}`));
        console.log(chalk.cyan('  npm install'));
        console.log(chalk.cyan('  router-cli deploy'));
      }

      // 询问是否立即部署
      let deployNow = options.deploy;
      if (!isNonInteractive && !options.deploy) {
        const { deployNow: shouldDeploy } = await prompt<{ deployNow: boolean }>({
          type: 'confirm',
          name: 'deployNow',
          message: 'Would you like to deploy this project to Cloudflare now?',
          initial: false
        });
        deployNow = shouldDeploy;
      }

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
  // 如果提供了配置文件，优先使用配置文件
  if (options.config) {
    try {
      const configPath = path.resolve(options.config);
      console.log(chalk.blue(`Loading configuration from: ${configPath}`));
      return ConfigFileManager.createConfigFromFile(configPath);
    } catch (error: any) {
      console.error(chalk.red(`Failed to load configuration file: ${error.message}`));
      process.exit(1);
    }
  }

  let name = options.name;
  let envVars = options.envVars;
  let compatibilityDate = options.compatibilityDate;
  let compatibilityFlags = options.compatibilityFlags;

  // 自动检测是否为非交互式模式
  const isNonInteractive = !!(options.name || options.envVars || 
                              options.compatibilityDate || options.compatibilityFlags);

  // 非交互式模式下必须有必要的参数
  if (isNonInteractive) {
    if (!name) {
      console.error(chalk.red('Error: Project name is required in non-interactive mode. Use --name option.'));
      process.exit(1);
    }
    if (!envVars) {
      envVars = 'NODE_ENV=production'; // 默认环境变量
    }
  }

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





  // 获取环境变量
  let environment: Record<string, string> = {};
  if (envVars) {
    envVars.split(',').forEach((pair: string) => {
      const [key, value] = pair.trim().split('=');
      if (key && value) {
        environment[key.trim()] = value.trim();
      }
    });
  } else if (!isNonInteractive) {
    const envResponse = await prompt<{ envVars: string }>({
      type: 'input',
      name: 'envVars',
      message: 'Enter environment variables (format: KEY1=value1,KEY2=value2)',
      initial: 'NODE_ENV=production'
    });

    if (envResponse.envVars) {
      envResponse.envVars.split(',').forEach((pair: string) => {
        const [key, value] = pair.trim().split('=');
        if (key && value) {
          environment[key.trim()] = value.trim();
        }
      });
    }
  }

  // 解析兼容性标志
  const compatibilityFlagsArray = compatibilityFlags ? compatibilityFlags.split(',').map((f: string) => f.trim()) : [];

  return {
    name,
    environment,
    wrangler: {
      compatibility_date: compatibilityDate || "2024-01-01",
      ...(compatibilityFlagsArray.length > 0 && {
        compatibility_flags: compatibilityFlagsArray
      })
    }
  };
}


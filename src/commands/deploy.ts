import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { WranglerManager } from '../utils/wrangler-manager';
import { ConfigManager } from '../utils/config-manager';
import { CloudflareApi } from '../utils/cloudflare-api';
import { spawn } from 'child_process';

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

export const deploy = new Command('deploy')
  .description('Deploy Router v7 project to Cloudflare Workers')
  .argument('[project]', 'Project name (defaults to current directory name)')
  .option('-e, --env <environment>', 'Environment (production, staging)', 'production')
  .action(async (project, options) => {
    // 自动检测是否为非交互式模式
    const isNonInteractive = !!project;
    
    // 1. 先检查参数和项目目录，不要先 spinner
    // 检查配置 - 支持两种认证方式
    const config = ConfigManager.getConfig();
    const hasApiToken = config?.apiToken;
    const hasWranglerLogin = await checkWranglerLogin();
    
    if (!hasApiToken && !hasWranglerLogin) {
      console.log(chalk.red('No authentication configured. Please run "router-cli config" first.'));
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
      
      // 优化URL提取逻辑
      const baseUrl = extractDeploymentUrl(deployOutput, projectName, options.env);
      
      if (baseUrl) {
        console.log(chalk.green(`\n✅ Your app is now live at: ${chalk.bold(baseUrl)}`));
        if (!isNonInteractive) {
          console.log(chalk.cyan(`\n📋 Available endpoints:`));
          console.log(chalk.cyan(`  GET  ${baseUrl}/`));
          console.log(chalk.cyan(`  GET  ${baseUrl}/health`));
          console.log(chalk.cyan(`  GET  ${baseUrl}/api/hello`));
          
          // 添加提示信息
          console.log(chalk.yellow(`\n💡 Tip: If the URL doesn't work immediately, wait a few minutes for DNS propagation.`));
        }
      } else {
        console.log(chalk.yellow(`\n⚠️  Couldn't extract URL from deployment output.`));
        if (!isNonInteractive) {
          console.log(chalk.cyan(`\n🔍 Trying to get URL from Cloudflare API...`));
        }
        
        try {
          const fallbackUrl = await getWorkerUrlFromApi(projectName, config?.apiToken || '');
          if (fallbackUrl) {
            console.log(chalk.green(`\n✅ Your app is now live at: ${chalk.bold(fallbackUrl)}`));
            if (!isNonInteractive) {
              console.log(chalk.cyan(`\n📋 Available endpoints:`));
              console.log(chalk.cyan(`  GET  ${fallbackUrl}/`));
              console.log(chalk.cyan(`  GET  ${fallbackUrl}/health`));
              console.log(chalk.cyan(`  GET  ${fallbackUrl}/api/hello`));
            }
          } else {
            console.log(chalk.yellow(`\n⚠️  Could not determine the exact URL.`));
            if (!isNonInteractive) {
              console.log(chalk.cyan(`\n🔍 You can check your deployment status with:`));
              console.log(chalk.cyan(`   router-cli list-all`));
            }
          }
        } catch (error) {
          console.log(chalk.yellow(`\n⚠️  Could not determine the exact URL.`));
          if (!isNonInteractive) {
            console.log(chalk.cyan(`\n🔍 You can check your deployment status with:`));
            console.log(chalk.cyan(`   router-cli list-all`));
          }
        }
      }

    } catch (error: any) {
      spinner.fail(`Deployment failed: ${error.message}`);
      console.error(chalk.red(error));
    }
  });

/**
 * 从wrangler部署输出中提取部署URL
 */
function extractDeploymentUrl(deployOutput: string, projectName: string, environment: string): string | null {
  console.log(chalk.gray('\n🔍 Analyzing deployment output...'));
  
  // 尝试多种URL模式匹配，按优先级排序
  const urlPatterns = [
    // 1. 最精确的匹配：包含"Deployed to"的行
    {
      pattern: /Deployed to\s+(https:\/\/[^\s]+)/i,
      description: 'Deployed to line'
    },
    // 2. 包含"URL:"的行
    {
      pattern: /URL:\s*(https:\/\/[^\s]+)/i,
      description: 'URL line'
    },
    // 3. 标准workers.dev URL格式
    {
      pattern: /https:\/\/[a-zA-Z0-9-]+\.workers\.dev/g,
      description: 'Standard workers.dev URL'
    },
    // 4. 包含项目名的URL
    {
      pattern: new RegExp(`https://${projectName.replace(/[^a-zA-Z0-9]/g, '')}[a-zA-Z0-9-]*\\.workers\\.dev`, 'g'),
      description: 'Project-specific URL'
    },
    // 5. 环境特定的URL
    {
      pattern: new RegExp(`https://${projectName.replace(/[^a-zA-Z0-9]/g, '')}-${environment}[a-zA-Z0-9-]*\\.workers\\.dev`, 'g'),
      description: 'Environment-specific URL'
    },
    // 6. 通用HTTPS URL
    {
      pattern: /https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      description: 'Generic HTTPS URL'
    }
  ];

  for (const { pattern, description } of urlPatterns) {
    const matches = deployOutput.match(pattern);
    if (matches && matches.length > 0) {
      let url = matches[0];
      
      // 如果是包含前缀的匹配，提取纯URL
      if (url.includes('Deployed to ')) {
        url = url.replace('Deployed to ', '');
      }
      if (url.includes('URL: ')) {
        url = url.replace('URL: ', '');
      }
      
      console.log(chalk.gray(`✅ Found URL using: ${description}`));
      console.log(chalk.gray(`   URL: ${url}`));
      return url;
    }
  }

  // 如果没找到，尝试从输出中查找包含特定关键词的行
  const lines = deployOutput.split('\n');
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('deployed to') || lowerLine.includes('url:') || lowerLine.includes('available at')) {
      const urlMatch = line.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        console.log(chalk.gray(`✅ Found URL in line: ${line.trim()}`));
        return urlMatch[0];
      }
    }
  }

  // 如果还是没找到，尝试从wrangler.toml中获取信息
  console.log(chalk.gray('⚠️  Could not extract URL from deployment output'));
  console.log(chalk.gray('   This might be due to wrangler output format changes'));
  
  return null;
}

/**
 * 从Cloudflare API获取Worker的URL
 */
async function getWorkerUrlFromApi(projectName: string, apiToken: string): Promise<string | null> {
  try {
    const config = ConfigManager.getConfig();
    if (!config?.accountId) {
      return null;
    }

    const cloudflareApi = new CloudflareApi(apiToken);
    const [workers, subdomain] = await Promise.all([
      cloudflareApi.getWorkers(config.accountId),
      cloudflareApi.getAccountSubdomain(config.accountId)
    ]);

    // 查找匹配的worker
    const worker = workers.find(w => w.name === projectName || w.id === projectName);
    if (worker) {
      const workerName = worker.name || worker.id;
      return `https://${workerName}.${subdomain}.workers.dev`;
    }

    return null;
  } catch (error) {
    console.log(chalk.gray(`   API fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    return null;
  }
} 
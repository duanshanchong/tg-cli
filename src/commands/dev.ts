import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ProjectDetector } from '../utils/project-detector';

export const dev = new Command('dev')
  .description('Start local development server for Router v7 project')
  .option('-e, --env <environment>', 'Environment (local, staging, production)', 'local')
  .option('-p, --port <port>', 'Port number', '8787')
  .option('--no-browser', 'Do not open browser automatically')
  .action(async (options) => {
    // 检查当前目录是否为项目目录
    const projectInfo = ProjectDetector.checkAndPrompt();
    
    if (!projectInfo.isProject) {
      console.log(chalk.red('\n❌ Cannot start development server: Not in a Router v7 project directory'));
      return;
    }
    
    // 验证项目
    const validation = ProjectDetector.validateProject(projectInfo.projectPath!);
    if (!validation.valid) {
      console.log(chalk.red('\n❌ Project validation failed:'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`));
      });
      return;
    }
    
    // 检查 .dev.vars 文件
    if (!projectInfo.hasDevVars) {
      const devVarsExamplePath = path.join(projectInfo.projectPath!, '.dev.vars.example');
      if (fs.existsSync(devVarsExamplePath)) {
        console.log(chalk.yellow('\n⚠️  No .dev.vars file found'));
        console.log(chalk.cyan('   Creating .dev.vars from template...'));
        
        try {
          const exampleContent = fs.readFileSync(devVarsExamplePath, 'utf-8');
          fs.writeFileSync(path.join(projectInfo.projectPath!, '.dev.vars'), exampleContent);
          console.log(chalk.green('   ✅ .dev.vars file created'));
          console.log(chalk.cyan('   Edit .dev.vars to configure your local environment variables'));
        } catch (error) {
          console.log(chalk.red(`   ❌ Failed to create .dev.vars: ${error}`));
        }
      }
    }
    
    // 获取项目配置
    const config = ProjectDetector.getProjectConfig(projectInfo.projectPath!);
    if (!config) {
      console.log(chalk.red('❌ Failed to read project configuration'));
      return;
    }
    
    // 检查环境是否存在
    if (options.env !== 'local' && !config.env?.[options.env]) {
      console.log(chalk.red(`❌ Environment "${options.env}" not found in wrangler.jsonc`));
      console.log(chalk.cyan('Available environments:'));
      if (config.env) {
        Object.keys(config.env).forEach(env => {
          console.log(chalk.cyan(`   • ${env}`));
        });
      }
      console.log(chalk.cyan('   • local (uses .dev.vars)'));
      return;
    }
    
    const spinner = ora(`Starting development server for ${projectInfo.projectName}...`).start();
    
    try {
      // 构建 wrangler 命令
      const args = ['dev'];
      
      if (options.env !== 'local') {
        args.push('--env', options.env);
      }
      
      args.push('--port', options.port);
      
      if (!options.browser) {
        args.push('--no-browser');
      }
      
      spinner.succeed(`Development server starting...`);
      
      console.log(chalk.cyan(`\n🚀 Starting ${projectInfo.projectName} on http://localhost:${options.port}`));
      console.log(chalk.gray(`   Environment: ${options.env}`));
      console.log(chalk.gray(`   Project: ${projectInfo.projectPath}`));
      
      if (options.env === 'local' && projectInfo.hasDevVars) {
        console.log(chalk.green('   ✅ Using local development variables (.dev.vars)'));
      }
      
      console.log(chalk.cyan('\n📋 Available endpoints:'));
      console.log(chalk.cyan(`   GET  http://localhost:${options.port}/`));
      console.log(chalk.cyan(`   GET  http://localhost:${options.port}/health`));
      console.log(chalk.cyan(`   GET  http://localhost:${options.port}/api/hello`));
      console.log(chalk.cyan(`   GET  http://localhost:${options.port}/api/config`));
      console.log(chalk.cyan(`   GET  http://localhost:${options.port}/api/debug/env`));
      
      console.log(chalk.yellow('\n💡 Press Ctrl+C to stop the server'));
      
      // 启动 wrangler dev
      const child = spawn('npx', ['wrangler', ...args], {
        stdio: 'inherit',
        shell: true,
        cwd: projectInfo.projectPath
      });
      
      child.on('error', (error) => {
        console.error(chalk.red(`Failed to start development server: ${error.message}`));
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          console.log(chalk.red(`\n❌ Development server stopped with code ${code}`));
        } else {
          console.log(chalk.green('\n✅ Development server stopped'));
        }
      });
      
    } catch (error: any) {
      spinner.fail(`Failed to start development server: ${error.message}`);
      console.error(chalk.red(error));
    }
  }); 
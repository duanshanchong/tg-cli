#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from './commands/config';
import { createProject } from './commands/create-project';
import { deploy } from './commands/deploy';
import { dev } from './commands/dev';
import { listAll } from './commands/list-all';
import { deleteWorker } from './commands/delete-worker';

const program = new Command();

program
  .name('router-cli')
  .description('CLI tool for creating and deploying Router v7 projects on Cloudflare Workers')
  .version('1.0.0');

// 添加命令
program.addCommand(config);
program.addCommand(createProject);
program.addCommand(deploy);
program.addCommand(dev);
program.addCommand(listAll);
program.addCommand(deleteWorker);

// 默认显示帮助信息
program.action(() => {
  console.log(chalk.blue('🚀 Router v7 CLI'));
  console.log(chalk.gray('Create and deploy Router v7 projects on Cloudflare Workers\n'));
  
  console.log(chalk.green('Available commands:'));
  console.log(chalk.cyan('  router-cli config          # Configure Cloudflare credentials'));
  console.log(chalk.cyan('  router-cli create-project  # Create a new Router v7 project'));
  console.log(chalk.cyan('  router-cli dev             # Start local development server'));
  console.log(chalk.cyan('  router-cli deploy          # Deploy project to Cloudflare'));
  console.log(chalk.cyan('  router-cli list-all        # List all deployed projects'));
  
  console.log(chalk.gray('\nFor more information, run: router-cli --help'));
});

program.parse(); 
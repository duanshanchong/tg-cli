import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface ProjectInfo {
  isProject: boolean;
  projectName?: string;
  projectPath?: string;
  hasWranglerConfig: boolean;
  hasPackageJson: boolean;
  hasSrcDirectory: boolean;
  hasDevVars: boolean;
  suggestions?: string[];
}

export class ProjectDetector {
  /**
   * 检测当前目录是否为 Router v7 项目
   */
  static detectProject(currentPath: string = process.cwd()): ProjectInfo {
    const projectName = path.basename(currentPath);
    const wranglerConfigPath = path.join(currentPath, 'wrangler.jsonc');
    const packageJsonPath = path.join(currentPath, 'package.json');
    const srcPath = path.join(currentPath, 'src');
    const devVarsPath = path.join(currentPath, '.dev.vars');
    
    const hasWranglerConfig = fs.existsSync(wranglerConfigPath);
    const hasPackageJson = fs.existsSync(packageJsonPath);
    const hasSrcDirectory = fs.existsSync(srcPath);
    const hasDevVars = fs.existsSync(devVarsPath);
    
    // 判断是否为 Router v7 项目
    const isProject = hasWranglerConfig && hasPackageJson && hasSrcDirectory;
    
    const suggestions: string[] = [];
    
    if (!isProject) {
      if (!hasWranglerConfig) {
        suggestions.push('Missing wrangler.jsonc file');
      }
      if (!hasPackageJson) {
        suggestions.push('Missing package.json file');
      }
      if (!hasSrcDirectory) {
        suggestions.push('Missing src directory');
      }
    }
    
    return {
      isProject,
      projectName,
      projectPath: currentPath,
      hasWranglerConfig,
      hasPackageJson,
      hasSrcDirectory,
      hasDevVars,
      suggestions
    };
  }
  
  /**
   * 检查并提示用户当前目录状态
   */
  static checkAndPrompt(): ProjectInfo {
    const projectInfo = this.detectProject();
    
    if (!projectInfo.isProject) {
      console.log(chalk.yellow('\n⚠️  Current directory is not a Router v7 project'));
      console.log(chalk.gray(`   Directory: ${projectInfo.projectPath}`));
      console.log(chalk.gray(`   Project name: ${projectInfo.projectName}`));
      
      if (projectInfo.suggestions && projectInfo.suggestions.length > 0) {
        console.log(chalk.red('\n❌ Issues found:'));
        projectInfo.suggestions.forEach(suggestion => {
          console.log(chalk.red(`   • ${suggestion}`));
        });
      }
      
      console.log(chalk.cyan('\n💡 Suggestions:'));
      console.log(chalk.cyan('   1. Navigate to a Router v7 project directory'));
      console.log(chalk.cyan('   2. Or create a new project: router-cli create-project'));
      console.log(chalk.cyan('   3. Or specify project name: router-cli deploy <project-name>'));
      
      return projectInfo;
    }
    
    // 项目存在，显示项目信息
    console.log(chalk.green(`\n✅ Router v7 project detected: ${projectInfo.projectName}`));
    console.log(chalk.gray(`   Path: ${projectInfo.projectPath}`));
    
    if (projectInfo.hasDevVars) {
      console.log(chalk.green('   ✅ Local development variables (.dev.vars) found'));
    } else {
      console.log(chalk.yellow('   ⚠️  No .dev.vars file found'));
      console.log(chalk.cyan('      Run: cp .dev.vars.example .dev.vars'));
    }
    
    return projectInfo;
  }
  
  /**
   * 获取项目配置信息
   */
  static getProjectConfig(projectPath: string): any {
    const wranglerConfigPath = path.join(projectPath, 'wrangler.jsonc');
    
    if (!fs.existsSync(wranglerConfigPath)) {
      return null;
    }
    
    try {
      const configContent = fs.readFileSync(wranglerConfigPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      console.log(chalk.red(`Error reading wrangler.jsonc: ${error}`));
      return null;
    }
  }
  
  /**
   * 验证项目是否可以运行
   */
  static validateProject(projectPath: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 检查必需文件
    const requiredFiles = [
      'wrangler.jsonc',
      'package.json',
      'src/index.ts'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(projectPath, file);
      if (!fs.existsSync(filePath)) {
        errors.push(`Missing ${file}`);
      }
    }
    
    // 检查 src 目录
    const srcPath = path.join(projectPath, 'src');
    if (!fs.existsSync(srcPath)) {
      errors.push('Missing src directory');
    }
    
    // 检查依赖是否安装
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      errors.push('Dependencies not installed (run: npm install)');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
} 
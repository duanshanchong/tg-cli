import fs from 'fs';
import path from 'path';
import { RouterV7Config } from '../types';

export interface ProjectConfigFile {
  project: {
    name: string;
  };
  environment: Record<string, string>;
  wrangler: {
    compatibility_date?: string;
    compatibility_flags?: string[];
    vars?: Record<string, string>;
    secrets?: string[];
  };
  deploy?: {
    auto_deploy?: boolean;
    environments?: string[];
  };
}

export class ConfigFileManager {
  /**
   * 从配置文件创建 RouterV7Config
   */
  static createConfigFromFile(configPath: string): RouterV7Config {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config: ProjectConfigFile = JSON.parse(configContent);

    // 验证必需的字段
    if (!config.project?.name) {
      throw new Error('Project name is required in configuration file');
    }

    // 转换配置格式
    return {
      name: config.project.name,
      environment: config.environment || {},
      wrangler: {
        compatibility_date: config.wrangler?.compatibility_date,
        compatibility_flags: config.wrangler?.compatibility_flags,
        vars: config.wrangler?.vars
      }
    };
  }

  /**
   * 创建默认配置文件
   */
  static createDefaultConfig(projectName: string): ProjectConfigFile {
    try {
      // 读取默认配置模板
      const templatePath = path.join(__dirname, '..', '..', 'templates', 'default-config.json');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      
      // 替换项目名称占位符
      const configContent = templateContent.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
      
      // 解析配置
      const config: ProjectConfigFile = JSON.parse(configContent);
      
      return config;
    } catch (error) {
      // 如果模板文件不存在或读取失败，使用硬编码的默认配置
      console.warn('Warning: Could not load default config template, using fallback configuration');
      return {
        project: {
          name: projectName
        },
        environment: {
          NODE_ENV: 'production',
          API_VERSION: 'v1',
          DEBUG: 'false'
        },
        wrangler: {
          compatibility_date: '2024-01-01',
          compatibility_flags: ['nodejs_compat'],
          vars: {
            CUSTOM_VAR: 'custom-value'
          },
          secrets: ['DATABASE_URL', 'JWT_SECRET']
        },
        deploy: {
          auto_deploy: true,
          environments: ['production']
        }
      };
    }
  }

  /**
   * 保存配置文件
   */
  static saveConfigFile(config: ProjectConfigFile, filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  }

  /**
   * 验证配置文件
   */
  static validateConfig(config: ProjectConfigFile): string[] {
    const errors: string[] = [];

    // 验证项目配置
    if (!config.project?.name) {
      errors.push('Project name is required');
    }





    return errors;
  }

  /**
   * 获取配置文件路径
   */
  static getConfigPath(projectName: string): string {
    return path.join(process.cwd(), `${projectName}-config.json`);
  }

  /**
   * 检查配置文件是否存在
   */
  static configExists(configPath: string): boolean {
    return fs.existsSync(configPath);
  }
} 
import dotenv from 'dotenv';
import { config as envConfig } from 'dotenv';
import { existsSync } from 'fs';

if (existsSync('.env')) {  
  dotenv.config();
}

export interface Configuration {
  WebsiteUrl: any;
  Name: string;
  Port: string;
  DbDsn: string;
  TcpPort: string;
  JwtSecretKey: string;
  TokenDuration: number; // in milliseconds (e.g., 86400000 for 24h)
  SmtpHost: string;
  SmtpPort: string;
  SmtpUserName: string;
  SmtpPassword: string;
  SmtpDisplayName: string;
  DbName:string;
}

function getEnvOrError(key: string): string {  
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} not set`);
  }
  return value;
}

function getEnvAsInt(key: string): number {
  const value = getEnvOrError(key);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} is not a valid number`);
  }
  return parsed;
}

function getEnvAsBool(key: string): boolean {
  const value = getEnvOrError(key).toLowerCase();
  return value === 'true';
}

let _config: Configuration | null = null;

export async function loadConfig():Promise<Configuration> {
  _config = {
    Name: getEnvOrError('PROJECT_NAME'),
    Port: getEnvOrError('PORT'),
    DbName:getEnvOrError('NAME'),
    DbDsn: getEnvOrError('DATABASE_URL'),
    TcpPort: getEnvOrError('TCP_PORT'),
    JwtSecretKey: getEnvOrError('SECRET_KEY'),
    TokenDuration: 24 * 60 * 60 * 1000,
    SmtpHost: getEnvOrError('SMTP_HOST'),
    SmtpPort: getEnvOrError('SMTP_PORT'),
    SmtpUserName: getEnvOrError('SMTP_USERNAME'),
    SmtpPassword: getEnvOrError('SMTP_PASSWORD'),
    SmtpDisplayName: getEnvOrError('SMTP_DISPLAY_NAME'),
    WebsiteUrl: getEnvOrError('WEBSITE_URL'),
  };
  
  if (!_config) {
    throw new Error('Configuration not loaded. Call loadConfig() first.');
  }

    return _config;
}

export {_config}

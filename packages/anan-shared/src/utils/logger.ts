// 统一日志工具
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  constructor(private prefix: string = 'anan') {}

  log(level: LogLevel, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] [${this.prefix}] ${message}`;
    switch (level) {
      case 'debug':
        console.debug(formatted, ...args);
        break;
      case 'info':
        console.info(formatted, ...args);
        break;
      case 'warn':
        console.warn(formatted, ...args);
        break;
      case 'error':
        console.error(formatted, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }
  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }
  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }
  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }
}

export const logger = new Logger();

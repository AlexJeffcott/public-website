type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogMessage = {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  data?: any
}

export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  private formatLog(
    level: LogLevel,
    message: string,
    data?: any,
  ): LogMessage {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
    }
  }

  private log(level: LogLevel, message: string, data?: any) {
    const logMessage = this.formatLog(level, message, data)

    switch (level) {
      case 'debug':
        console.debug(logMessage)
        break
      case 'info':
        console.info(logMessage)
        break
      case 'warn':
        console.warn(logMessage)
        break
      case 'error':
        console.error(logMessage)
        break
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }
}

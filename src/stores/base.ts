import { Logger } from '@/utils/logger.ts'

export class BaseStore {
  logger: Logger
  constructor(ctx: string) {
    this.logger = new Logger(ctx)
  }
}

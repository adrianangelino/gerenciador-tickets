import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);
  private redisClient: RedisClientType;

  constructor() {
    this.redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }) as RedisClientType;

    this.redisClient.connect();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredTokens(): Promise<void> {
    this.logger.log('Running token cleanup...');
    const keys = await this.redisClient.keys('user:*');
    let removed = 0;

    for (const key of keys) {
      const ttl = await this.redisClient.ttl(key);
      if (ttl <= 0) {
        await this.redisClient.del(key);
        removed++;
      }
    }

    this.logger.log(`Token cleanup done. Removed ${removed} expired entries.`);
  }
}

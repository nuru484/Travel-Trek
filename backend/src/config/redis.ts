import { createClient, RedisClientType } from 'redis';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

const client: RedisClientType = createClient();

type KeyGeneratorFn = (req: Request) => string;

client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await client.connect();
})();

// Middleware for caching
const cacheMiddleware =
  (keyGenerator: KeyGeneratorFn) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cacheKey = keyGenerator(req);

      const data = await client.get(cacheKey);
      if (data) {
        logger.info('Cache hit');

        client.expire(cacheKey, 3600); // Extend TTL on access

        return res.status(200).json({
          message: `${cacheKey} successfully fetched from redis`,
          ...JSON.parse(data),
        });
      }

      logger.info('Cache miss');
      next();
    } catch (err) {
      logger.error('Error accessing Redis:', err);
      next();
    }
  };

const saveToCache = (key: string, value: any, ttl: number = 3600): void => {
  client.setEx(key, ttl, JSON.stringify(value));
};

export { cacheMiddleware, saveToCache, client };

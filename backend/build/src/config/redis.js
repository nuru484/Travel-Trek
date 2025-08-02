"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.saveToCache = exports.cacheMiddleware = void 0;
const redis_1 = require("redis");
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const client = (0, redis_1.createClient)();
exports.client = client;
client.on('error', (err) => console.log('Redis Client Error', err));
(async () => {
    await client.connect();
})();
// Middleware for caching
const cacheMiddleware = (keyGenerator) => async (req, res, next) => {
    try {
        const cacheKey = keyGenerator(req);
        const data = await client.get(cacheKey);
        if (data) {
            logger_js_1.default.info('Cache hit');
            client.expire(cacheKey, 3600); // Extend TTL on access
            return res.status(200).json({
                message: `${cacheKey} successfully fetched from redis`,
                ...JSON.parse(data),
            });
        }
        logger_js_1.default.info('Cache miss');
        next();
    }
    catch (err) {
        logger_js_1.default.error('Error accessing Redis:', err);
        next();
    }
};
exports.cacheMiddleware = cacheMiddleware;
const saveToCache = (key, value, ttl = 3600) => {
    client.setEx(key, ttl, JSON.stringify(value));
};
exports.saveToCache = saveToCache;

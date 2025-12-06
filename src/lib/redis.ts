/**
 * Shared Redis connection configuration for BullMQ workers
 * Supports both local Redis and Upstash (cloud Redis)
 */

export function getRedisConnection() {
    // If REDIS_URL is set (Upstash), parse it
    if (process.env.REDIS_URL) {
        const url = new URL(process.env.REDIS_URL);
        return {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
            password: url.password,
            tls: url.protocol === 'rediss:' ? {} : undefined,
        };
    }

    // Fallback to local Redis
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    };
}

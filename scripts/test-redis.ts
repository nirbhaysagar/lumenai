
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
    process.exit(1);
});

redis.on('connect', () => {
    console.log('Redis connected successfully!');
    redis.ping().then((res) => {
        console.log('Redis PING response:', res);
        process.exit(0);
    });
});

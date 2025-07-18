const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => Math.min(retries * 100, 5000)
      }
    });

    this.client.on('error', (err) =>
      console.error('Redis error:', err.message)
    );

    this.connected = false;
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
      console.log('✅ Redis connected');
    }
    return this.client; // Return the connected client instance
  }

  // You generally don't need a separate getClient if connect ensures connection and returns the client.
  // async getClient() {
  //   if (!this.connected) {
  //     await this.connect();
  //   }
  //   return this.client;
  // }
}

// Singleton instance: This is the single instance of your RedisClient class
const redisInstance = new RedisClient();

const ORDER_CACHE_PREFIX = 'order:';

// These functions must use the 'redisInstance.client' to access Redis commands
const cacheOrder = async (order) => {
  await redisInstance.client.setEx(
    `${ORDER_CACHE_PREFIX}${order._id}`,
    3600, // Cache for 1 hour
    JSON.stringify(order)
  );
};

const getCachedOrder = async (orderId) => {
  const cached = await redisInstance.client.get(`${ORDER_CACHE_PREFIX}${orderId}`);
  return cached ? JSON.parse(cached) : null;
};

// Export the necessary components: the connect function, the redis client instance, and the cache functions
module.exports = {
  connect: () => redisInstance.connect(), // A function to connect to Redis
  redisClient: redisInstance.client,     // The actual connected ioredis client
  cacheOrder,
  getCachedOrder
};
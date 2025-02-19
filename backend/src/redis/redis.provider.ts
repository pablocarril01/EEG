import { createClient } from 'redis';
const redis = require('redis');

export const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_DB,
  },
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => console.error('Redis error:', err));

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('✅ Conectado a Redis');
    }
  } catch (err) {
    console.error('❌ Error de conexión a Redis:', err);
  }
};

export const getRedisData = async (proyectoId: number, usuarioId: string) => {
  const key = `proyecto:${proyectoId}:${usuarioId}:datos`;
  try {
    const data = await redisClient.lRange(key, -100, -1); // Últimos 100 valores
    console.log('últimos 100 datos conseguidos');
    return data;
  } catch (err) {
    console.error('❌ Error obteniendo datos de Redis:', err);
    throw err;
  }
};

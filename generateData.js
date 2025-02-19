const redis = require("redis");
require("dotenv").config();

// Configurar conexión a Redis desde .env
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("error", (err) => {
  console.error("Error en Redis:", err);
});

// Conectar al cliente Redis
(async () => {
  await redisClient.connect();
  console.log("Conectado a Redis");
})();

const proyectoId = 33; // Cambia si es necesario
const usuarioId = "prueba"; // Cambia si es necesario

const redisKey = `proyecto:${proyectoId}:${usuarioId}:datos`;

// Función para generar un dato aleatorio en hexadecimal
const generateHexValue = () => {
  return Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, "0");
};

// Función para generar y enviar datos a Redis
const sendDataToRedis = async () => {
  const values = Array.from({ length: 8 }, generateHexValue);
  const dataString = values.join(";");

  try {
    await redisClient.rPush(redisKey, dataString);
    console.log(`Dato enviado a Redis (${redisKey}):`, dataString);
  } catch (err) {
    console.error("Error al enviar datos a Redis:", err);
  }
};

// Enviar datos cada 250 ms durante 1 minuto
const interval = setInterval(sendDataToRedis, 250);
setTimeout(async () => {
  clearInterval(interval);
  await redisClient.quit();
  console.log("Finalizado: Se enviaron datos durante 1 minuto.");
}, 60000);

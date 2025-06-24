import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import historicoRouter from './historico/historico';

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Habilitar CORS
app.use(cors());

// Montar el router de histórico bajo /api/historico
app.use('/api/historico', historicoRouter);

// Crear el cliente de Redis
const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost', // Dirección del servidor Redis
    port: parseInt(process.env.REDIS_PORT || '6379'), // Puerto de Redis
  },
});

// Manejar errores de conexión
client.on('error', (err) => {
  console.error('Error de conexión a Redis:', err);
});

// Conectar al servidor de Redis
client.connect();

// Ruta para obtener los valores hexadecimales desde Redis
app.get('/api/hexValues', async (req, res) => {
  try {
    const data = await client.get('hexValues');
    if (data) {
      const parsedData = JSON.parse(data); // Parseamos los datos
      res.json(parsedData); // Devolvemos los datos en formato JSON
    } else {
      res.status(404).json({ error: 'No se encontraron datos en Redis' });
    }
  } catch (err) {
    console.error('Error al obtener datos de Redis:', err);
    res.status(500).json({ error: 'Error al obtener datos de Redis' });
  }
});

// Exportar la aplicación Express
export default app;

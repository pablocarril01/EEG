import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import historicoRouter from './historico/historico';

console.log('🚀 Arrancando API en', __filename);

const app = express();

app.use(express.json());
app.use(cors());

// Monta las rutas de histórico en /api/historico
app.use('/api/historico', historicoRouter);

console.log(
  'RUTAS EXPRESS:',
  app._router.stack
    .filter((layer) => layer.route)
    .map((layer) => {
      const route = (layer as any).route;
      const method = Object.keys(route.methods)[0].toUpperCase();
      return `${method} ${route.path}`;
    }),
);

// (Opcional) Otra ruta, p.ej. para Redis
app.get('/api/hexValues', async (_req: Request, res: Response) => {
  const { createClient } = await import('redis');
  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  });
  try {
    await client.connect();
    const data = await client.get('hexValues');
    await client.disconnect();
    if (data) {
      res.json(JSON.parse(data));
    } else {
      res.status(404).json({ error: 'No se encontraron datos en Redis' });
    }
  } catch (error) {
    console.error('Error al obtener datos de Redis:', error);
    res.status(500).json({ error: 'Error al obtener datos de Redis' });
  }
});

// Carga certificados TLS
const key = fs.readFileSync(path.resolve(__dirname, '../cert/key.pem'), 'utf8');
const cert = fs.readFileSync(
  path.resolve(__dirname, '../cert/cert.pem'),
  'utf8',
);
https.createServer({ key, cert }, app).listen(443, () => {
  console.log('Servidor HTTPS en puerto 443');
});

// Redirigir todo HTTP → HTTPS
const redirectApp = express();
redirectApp.get('*', (req: Request, res: Response) => {
  const host = (req.headers.host || '').split(':')[0];
  res.redirect(`https://${host}${req.url}`);
});
http.createServer(redirectApp).listen(80, () => {
  console.log('Servidor HTTP redirige a HTTPS en puerto 80');
});
export default app;

import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import historicoRouter from './historico/historico';

const app = express();

// JSON + CORS
app.use(express.json());
app.use(cors());

// Monta el histórico en /api/historico
app.use('/api/historico', historicoRouter);

// (Opcional) Otra ruta genérica, p.ej. Redis...
// app.get('/api/hexValues', ...);

// Carga TLS
const key  = fs.readFileSync(path.resolve(__dirname, '../cert/key.pem'));
const cert = fs.readFileSync(path.resolve(__dirname, '../cert/cert.pem'));
const server = https.createServer({ key, cert }, app);
server.listen(443, () => {
  console.log('HTTPS en 443');
});

// Redirige HTTP→HTTPS
const redirect = express();
redirect.get('*', (req: Request, res: Response) => {
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  res.redirect(`https://${host}${req.url}`);
});
http.createServer(redirect).listen(80, () => {
  console.log('HTTP redirige a HTTPS en 80');
});

export default app;

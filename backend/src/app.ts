// backend/src/historico/historico.ts
import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { spawn } from 'child_process';
import path from 'path';

// Creamos un Router de Express
const router = express.Router();

// Configuración de PostgreSQL
const pool = new Pool({
  host:     process.env.PG_HOST,
  port:     Number(process.env.PG_PORT),
  database: process.env.PG_DB,
  user:     process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

// 1) Listar pacientes únicos
// GET /api/historico/patients
router.get(
  '/patients',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await pool.query<{ id_paciente: string }>(
        `SELECT DISTINCT id_paciente FROM pepi ORDER BY id_paciente;`
      );
      const pacientes = rows.map(r => r.id_paciente);
      res.json(pacientes);
      next();
    } catch (err) {
      console.error('Error obteniendo pacientes:', err);
      next(err);
    }
  }
);

// 2) Servir datos históricos para gráfica
// GET /api/historico?paciente=...&start=YYYY-MM-DD&end=YYYY-MM-DD
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    const { paciente, start, end } = req.query as Record<string, string>;
    if (!paciente || !start || !end) {
      res.status(400).json({ error: 'Faltan parámetros: paciente, start o end' });
      return next();
    }
    try {
      const { rows } = await pool.query(
        `SELECT fp1, fp2, t3, t4, o1, o2, c3, c4, evento
         FROM pepi
         WHERE id_paciente = $1
           AND ts BETWEEN $2 AND $3
         ORDER BY ts;`,
        [paciente, start, end]
      );

      const datos: number[][] = rows.map(row =>
        ['fp1','fp2','t3','t4','o1','o2','c3','c4','evento']
          .map(ch => Number((row as any)[ch]))
      );

      res.json({ datos });
      next();
    } catch (err) {
      console.error('Error obteniendo histórico:', err);
      next(err);
    }
  }
);

// 3) Generar y servir EDF
// GET /api/historico/edf?paciente=...&start=...&end=...
router.get(
  '/edf',
  async (req: Request, res: Response, next: NextFunction) => {
    const { paciente, start, end } = req.query as Record<string, string>;
    if (!paciente || !start || !end) {
      res.status(400).json({ error: 'Faltan parámetros: paciente, start o end' });
      return next();
    }
    try {
      const scriptPath = path.resolve(__dirname, '../../scripts/generate_edf.py');
      const py = spawn('python3', [
        scriptPath,
        '--paciente', paciente,
        '--start', start,
        '--end', end
      ]);

      const chunks: Buffer[] = [];
      py.stdout.on('data', chunk => chunks.push(Buffer.from(chunk)));
      py.stderr.on('data', err => console.error('EDF script error:', err.toString()));

      py.on('close', code => {
        if (code === 0) {
          const edfBuffer = Buffer.concat(chunks);
          const filename = `${paciente}_${start.replace(/-/g,'')}-${end.replace(/-/g,'')}.edf`;
          res
            .status(200)
            .header('Content-Type', 'application/octet-stream')
            .header('Content-Disposition', `attachment; filename=${filename}`)
            .send(edfBuffer);
          next();
        } else {
          console.error(`EDF script exited with code ${code}`);
          next(new Error('Error generando archivo EDF'));
        }
      });
    } catch (err) {
      console.error('Error interno generando EDF:', err);
      next(err);
    }
  }
);

export default router;

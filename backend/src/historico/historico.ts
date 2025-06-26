import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

const pool = new Pool({
  host: process.env.PG_HOST!,
  port: Number(process.env.PG_PORT),
  database: process.env.PG_DB!,
  user: process.env.PG_USER!,
  password: process.env.PG_PASSWORD!,
});

// 1) Listar pacientes únicos: GET /api/historico/pacientes
router.get('/pacientes', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<{ id_paciente: string }>(
      'SELECT DISTINCT id_paciente FROM pepi ORDER BY id_paciente;',
    );
    const lista = result.rows.map((r) => r.id_paciente);
    res.json(lista);
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    res.status(500).json({ error: 'Error al obtener lista de pacientes' });
  }
});

// 2) Servir datos históricos: GET /api/historico?paciente=..&start=..&end=..
router.get('/', async (req: Request, res: Response) => {
  const paciente = String(req.query.paciente || '');
  const start = String(req.query.start || '');
  const end = String(req.query.end || '');

  if (!paciente || !start || !end) {
    res.status(400).json({ error: 'Faltan parámetros: paciente, start o end' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `SELECT fp1, fp2, t3, t4, o1, o2, c3, c4
       FROM pepi
       WHERE id_paciente = $1
         AND ts BETWEEN $2 AND $3
       ORDER BY ts;`,
      [paciente, start, end],
    );
    const datos = rows.map((row: any) =>
      ['fp1', 'fp2', 't3', 't4', 'o1', 'o2', 'c3', 'c4'].map((canal) =>
        Number(row[canal]),
      ),
    );
    res.json({ datos });
  } catch (error) {
    console.error('Error obteniendo histórico:', error);
    res.status(500).json({ error: 'Error al obtener histórico de datos' });
  }
});

// 3) Generar y servir EDF: GET /api/historico/edf?paciente=..&start=..&end=..
router.get('/edf', async (req: Request, res: Response) => {
  const paciente = String(req.query.paciente || '');
  const start = String(req.query.start || '');
  const end = String(req.query.end || '');

  if (!paciente || !start || !end) {
    res.status(400).json({ error: 'Faltan parámetros: paciente, start o end' });
    return;
  }

  try {
    const scriptPath = path.resolve(__dirname, '../../scripts/postgres-edf.py');
    const py = spawn('python3', [
      scriptPath,
      '--paciente',
      paciente,
      '--start',
      start,
      '--end',
      end,
    ]);

    const bufs: Buffer[] = [];
    py.stdout.on('data', (chunk) => bufs.push(chunk));
    py.stderr.on('data', (err) =>
      console.error('EDF script error:', err.toString()),
    );

    py.on('close', (code) => {
      if (code === 0) {
        const edf = Buffer.concat(bufs);
        const filename = `${paciente}_${start.replace(/-/g, '')}-${end.replace(/-/g, '')}.edf`;
        res
          .status(200)
          .header('Content-Type', 'application/octet-stream')
          .header('Content-Disposition', `attachment; filename=${filename}`)
          .send(edf);
      } else {
        console.error(`EDF script exited with code ${code}`);
        res.status(500).json({ error: 'Error generando archivo EDF' });
      }
    });
  } catch (error) {
    console.error('Error interno generando EDF:', error);
    res.status(500).json({ error: 'Error interno al generar EDF' });
  }
});

export default router;

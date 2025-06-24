import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

const pool = new Pool({
  host:     process.env.PG_HOST!,
  port:     Number(process.env.PG_PORT),
  database: process.env.PG_DB!,
  user:     process.env.PG_USER!,
  password: process.env.PG_PASSWORD!,
});

// 1) GET  /api/historico/pacientes
router.get(
  '/pacientes',
  async (_req: Request, res: Response) => {
    try {
      const { rows } = await pool.query<{ id_paciente: string }>(
        'SELECT DISTINCT id_paciente FROM pepi ORDER BY id_paciente;'
      );
      res.json(rows.map(r => r.id_paciente));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error al obtener pacientes' });
    }
  }
);

// 2) GET  /api/historico?paciente=..&start=..&end=..
router.get(
  '/',
  async (req: Request, res: Response) => {
    const paciente = String(req.query.paciente || '');
    const start   = String(req.query.start   || '');
    const end     = String(req.query.end     || '');
    if (!paciente || !start || !end) {
      res.status(400).json({ error: 'Faltan parámetros' });
      return;
    }
    try {
      const { rows } = await pool.query(
        `SELECT fp1,fp2,t3,t4,o1,o2,c3,c4,evento
         FROM pepi
         WHERE id_paciente = $1 AND ts BETWEEN $2 AND $3
         ORDER BY ts;`,
        [paciente, start, end]
      );
      const datos = rows.map((row: any) =>
        ['fp1','fp2','t3','t4','o1','o2','c3','c4','evento']
          .map(ch => Number(row[ch]))
      );
      res.json({ datos });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error al obtener histórico' });
    }
  }
);

// 3) GET  /api/historico/edf?paciente=..&start=..&end=..
router.get(
  '/edf',
  async (req: Request, res: Response) => {
    const paciente = String(req.query.paciente || '');
    const start   = String(req.query.start   || '');
    const end     = String(req.query.end     || '');
    if (!paciente || !start || !end) {
      res.status(400).json({ error: 'Faltan parámetros' });
      return;
    }
    try {
      const script = path.join(__dirname, '../../scripts/generate_edf.py');
      const py = spawn('python3', [
        script, '--paciente', paciente,
                '--start',    start,
                '--end',      end
      ]);
      const bufs: Buffer[] = [];
      py.stdout.on('data', d => bufs.push(d));
      py.stderr.on('data', d => console.error(d.toString()));
      py.on('close', code => {
        if (code === 0) {
          const file = Buffer.concat(bufs);
          const name = `${paciente}_${start.replace(/-/g,'')}-${end.replace(/-/g,'')}.edf`;
          res
            .status(200)
            .header('Content-Type', 'application/octet-stream')
            .header('Content-Disposition', `attachment; filename=${name}`)
            .send(file);
        } else {
          res.status(500).json({ error: 'Error generando EDF' });
        }
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error interno al generar EDF' });
    }
  }
);

export default router;

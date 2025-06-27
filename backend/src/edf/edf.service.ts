import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';
import type { Response } from 'express';

@Injectable()
export class EdfService {
  generarEdf(paciente: string, desde: string, hasta: string, res: Response) {
    // process.cwd() === /home/grupo-cima/EEG/backend
    const scriptPath = join(process.cwd(), 'scripts', 'postgres-edf.py');

    console.log('EDF script path:', scriptPath);

    const py = spawn('python3', [scriptPath, paciente, desde, hasta]);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${paciente}_${desde.replace(/-/g, '')}-${hasta.replace(/-/g, '')}.edf"`,
    });

    py.stdout.pipe(res);
    py.stderr.on('data', (d) => console.error('EDF error:', d.toString()));
    py.on('close', (code) => {
      if (code !== 0) {
        throw new InternalServerErrorException('Error generando EDF');
      }
      res.end();
    });
  }
}

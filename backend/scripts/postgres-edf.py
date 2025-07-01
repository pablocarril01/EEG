#!/usr/bin/env python3
import sys, os
from datetime import datetime, timedelta
import psycopg2
import pyedflib
import numpy as np

# Uso: postgres-edf.py <paciente> <YYYY-MM-DD> <YYYY-MM-DD>
if len(sys.argv) != 4:
    print("Uso: postgres-edf.py <paciente> <YYYY-MM-DD> <YYYY-MM-DD>", file=sys.stderr)
    sys.exit(1)

paciente     = sys.argv[1]
fecha_inicio = datetime.fromisoformat(sys.argv[2])
fecha_fin    = datetime.fromisoformat(sys.argv[3]) + timedelta(hours=23, minutes=59, seconds=59)

# 1) Conectar a Postgres y extraer los 8 canales
conn = psycopg2.connect(
    host     = os.getenv('PG_HOST'),
    port     = os.getenv('PG_PORT'),
    dbname   = os.getenv('PG_DB'),
    user     = os.getenv('PG_USER'),
    password = os.getenv('PG_PASSWORD'),
)
cur = conn.cursor()
cur.execute("""
    SELECT ts, fp1, fp2, t3, t4, o1, o2, c3, c4
      FROM pepi
     WHERE id_paciente = %s
       AND ts BETWEEN %s AND %s
     ORDER BY ts
""", (paciente, fecha_inicio, fecha_fin))
rows = cur.fetchall()
cur.close()
conn.close()

if not rows:
    print(f"No hay datos para id_paciente={paciente} en {sys.argv[2]}–{sys.argv[3]}", file=sys.stderr)
    sys.exit(1)

# 2) Prepara parámetros EDF para 8 canales
n_channels     = 8
sample_rate    = 500
labels         = ['fp1','fp2','t3','t4','o1','o2','c3','c4']
phys_min       = [min(r[i+1] for r in rows) for i in range(n_channels)]
phys_max       = [max(r[i+1] for r in rows) for i in range(n_channels)]
dig_min        = [-32768] * n_channels
dig_max        = [ 32767] * n_channels

# 3) Crea archivo EDF temporal
outfile = f"/tmp/{paciente}_{sys.argv[2]}_{sys.argv[3]}.edf"
edf = pyedflib.EdfWriter(outfile, n_channels=n_channels, file_type=pyedflib.FILETYPE_EDFPLUS)

# 4) Cabecera global completa
edf.setHeader({
    'technician':           '',
    'recording_additional': '',
    'patientname':          '',
    'patientcode':          paciente,
    'equipment':            '',
    'admincode':            '',
    'patient_additional':   '',
    'startdate':            fecha_inicio,    # datetime
    'birthdate':            '',
    'sex':                  ''
})

# 5) Cabeceras por señal usando sample_frequency
signal_headers = []
for i in range(n_channels):
    signal_headers.append({
        'label':             labels[i],
        'dimension':         'uV',
        'sample_frequency':  sample_rate,
        'physical_min':      phys_min[i],
        'physical_max':      phys_max[i],
        'digital_min':       dig_min[i],
        'digital_max':       dig_max[i],
        'transducer':        '',
        'prefilter':         ''
    })
edf.setSignalHeaders(signal_headers)

# 6) Prepara datos como arrays numpy contiguos
data = [
    np.array([float(r[i+1]) for r in rows], dtype=np.float64, order='C')
    for i in range(n_channels)
]

# 7) Escribe y cierra
edf.writeSamples(data)
edf.close()

# 8) Emite por stdout y borra el temporal
with open(outfile, 'rb') as f:
    sys.stdout.buffer.write(f.read())
os.remove(outfile)

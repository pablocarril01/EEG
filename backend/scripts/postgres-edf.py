#!/usr/bin/env python3
import sys
import os
from datetime import datetime, timedelta
import psycopg2
import pyedflib

# Uso: postgres-edf.py <paciente> <YYYY-MM-DD> <YYYY-MM-DD>
if len(sys.argv) != 4:
    print("Uso: postgres-edf.py <paciente> <YYYY-MM-DD> <YYYY-MM-DD>", file=sys.stderr)
    sys.exit(1)

paciente    = sys.argv[1]
fecha_inicio = datetime.fromisoformat(sys.argv[2])
# incluir todo el día final
fecha_fin    = datetime.fromisoformat(sys.argv[3]) + timedelta(hours=23, minutes=59, seconds=59)

# Conexión a Postgres
conn = psycopg2.connect(
    host=os.getenv('PG_HOST'),
    port=os.getenv('PG_PORT'),
    dbname=os.getenv('PG_DB'),
    user=os.getenv('PG_USER'),
    password=os.getenv('PG_PASS')
)
cur = conn.cursor()
cur.execute("""
    SELECT timestamp, canal1, canal2, canal3
    FROM pepi
    WHERE paciente_id = %s
      AND timestamp BETWEEN %s AND %s
    ORDER BY timestamp
""", (paciente, fecha_inicio, fecha_fin))
rows = cur.fetchall()
cur.close()
conn.close()

# Crear EDF
start_str = fecha_inicio.strftime('%Y%m%d')
end_str   = fecha_fin.strftime('%Y%m%d')
outfile = f"{paciente}_{start_str}-{end_str}.edf"

with pyedflib.EdfWriter(outfile, n_channels=3) as f:
    channel_info = [
        {'label': 'canal1', 'dimension': 'uV', 'sample_rate': 100},
        {'label': 'canal2', 'dimension': 'uV', 'sample_rate': 100},
        {'label': 'canal3', 'dimension': 'uV', 'sample_rate': 100},
    ]
    f.setSignalHeaders(channel_info)

    data = [ [] for _ in range(3) ]
    for ts, c1, c2, c3 in rows:
        data[0].append(c1)
        data[1].append(c2)
        data[2].append(c3)
    f.writeSamples(data)

# Emitir EDF por stdout
with open(outfile, 'rb') as f:
    sys.stdout.buffer.write(f.read())

# Borrar fichero temporal
os.remove(outfile)

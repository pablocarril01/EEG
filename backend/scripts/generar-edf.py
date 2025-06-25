import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import psycopg2
import pandas as pd
import numpy as np
from pyedflib import EdfWriter

# 1) Cargar y validar .env
load_dotenv()
required = ["PG_HOST", "PG_PORT", "PG_DB", "PG_USER", "PG_PASSWORD"]
config = {k: os.getenv(k) for k in required}
missing = [k for k, v in config.items() if not v]
if missing:
    print("Error: faltan en .env:", ", ".join(missing))
    sys.exit(1)

PG_HOST     = config["PG_HOST"]
PG_PORT     = config["PG_PORT"]
PG_DB       = config["PG_DB"]
PG_USER     = config["PG_USER"]
PG_PASSWORD = config["PG_PASSWORD"]

# 2) Conectar a PostgreSQL
try:
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        dbname=PG_DB,
        user=PG_USER,
        password=PG_PASSWORD
    )
except Exception as e:
    print("Error conectando a PostgreSQL:", e)
    sys.exit(1)

# 3) Parámetros de consulta
paciente     = "Ernesto"
fecha_inicio = datetime(2025, 6, 22, 0,  0,  0)
fecha_fin    = datetime(2025, 6, 24, 23, 59, 59)

# 4) Leer datos
query = """
SELECT ts, fp1, fp2, t3, t4, o1, o2, c3, c4
FROM pepi
WHERE id_paciente = %s
  AND ts BETWEEN %s AND %s
ORDER BY ts;
"""
df = pd.read_sql_query(query, conn, params=(paciente, fecha_inicio, fecha_fin))
conn.close()
if df.empty:
    print("No se encontraron registros para Pablo en esas fechas")
    sys.exit(1)

# 5) Calcular frecuencia de muestreo
intervals = df['ts'].diff().dt.total_seconds().dropna().values
fs = int(round(1.0 / np.median(intervals))) if len(intervals) else 1
print("Frecuencia estimada: {} Hz".format(fs))

# 6) Preparar señales
channels = ['fp1','fp2','t3','t4','o1','o2','c3','c4']
signals  = [df[ch].to_numpy() for ch in channels]

# 7) Crear headers EDF, limitando a 6 cifras significativas
headers = []
for ch, data in zip(channels, signals):
    if ch == "evento":
        pmin, pmax, dmin, dmax, dim = 0.0, 1.0, 0, 1, ""
    else:
        raw_min = float(data.min())
        raw_max = float(data.max())
        # recortar a 6 cifras significativas para no superar 8 caracteres
        pmin = float(f"{raw_min:.6g}")
        pmax = float(f"{raw_max:.6g}")
        dmin, dmax, dim = -32768, 32767, "uV"
    headers.append({
        'label':            ch,
        'dimension':        dim,
        'sample_frequency': fs,
        'physical_min':     pmin,
        'physical_max':     pmax,
        'digital_min':      dmin,
        'digital_max':      dmax,
        'transducer':       '',
        'prefilter':        ''
    })

# 8) Escribir EDF
start_str = fecha_inicio.strftime("%Y%m%d")
end_str   = fecha_fin.strftime("%Y%m%d")
outfile = f"{paciente}_{start_str}-{end_str}.edf"

with EdfWriter(outfile, len(signals)) as w:
    w.setSignalHeaders(headers)
    w.writeSamples(signals)

print("EDF generado en:", outfile)

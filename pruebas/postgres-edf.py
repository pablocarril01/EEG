#!/usr/bin/env python3
import os
from datetime import datetime
from dotenv import load_dotenv
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from pyedflib import EdfWriter

# 1) Cargar variables de entorno
load_dotenv()
DB_HOST     = os.getenv("DB_HOST")
DB_PORT     = os.getenv("DB_PORT")
DB_NAME     = os.getenv("DB_NAME")
DB_USER     = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# 2) Crear engine SQLAlchemy
url = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(url)

# 3) Definir paciente y rango de fechas
paciente      = "Pablo"
fecha_inicio  = datetime(2025, 6, 16, 0,  0,  0)
fecha_fin     = datetime(2025, 6, 18, 23, 59, 59)

# 4) Ejecutar consulta
query = """
SELECT ts, fp1, fp2, t3, t4, o1, o2, c3, c4, evento
FROM pepi
WHERE id_paciente = %s
  AND ts BETWEEN %s AND %s
ORDER BY ts;
"""
df = pd.read_sql_query(query, engine, params=[paciente, fecha_inicio, fecha_fin])
if df.empty:
    raise RuntimeError("No se encontraron registros para Pablo en esas fechas")

# 5) Calcular frecuencia de muestreo (Hz)
intervals = df['ts'].diff().dt.total_seconds().dropna().values
fs = int(round(1.0 / np.median(intervals))) if len(intervals) > 0 else 1
print(f"Frecuencia de muestreo estimada: {fs} Hz")

# 6) Preparar datos para EDF
channel_labels = ['fp1','fp2','t3','t4','o1','o2','c3','c4','evento']
signals = [df[ch].to_numpy() for ch in channel_labels]

# 7) Crear headers de señales
signal_headers = []
for ch, data in zip(channel_labels, signals):
    phys_min = float(np.min(data))
    phys_max = float(np.max(data))
    if ch == 'evento':
        phys_min, phys_max = 0.0, 1.0
        dig_min, dig_max = 0, 1
        dimension = ''
    else:
        dig_min, dig_max = -32768, 32767
        dimension = 'uV'
    header = {
        'label':            ch,
        'dimension':        dimension,
        'sample_frequency': fs,
        'physical_min':     phys_min,
        'physical_max':     phys_max,
        'digital_min':      dig_min,
        'digital_max':      dig_max,
        'transducer':       '',
        'prefilter':        ''
    }
    signal_headers.append(header)

# 8) Escribir EDF
output_file = "pablo_data.edf"
with EdfWriter(output_file, len(signals)) as writer:
    writer.setSignalHeaders(signal_headers)
    writer.writeSamples(signals)

print(f"¡EDF creado correctamente! → {output_file}")

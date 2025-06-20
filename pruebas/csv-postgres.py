import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables del archivo .env
load_dotenv()

# Leer variables de entorno
DB_HOST = os.getenv("PG_HOST")
DB_PORT = os.getenv("PG_PORT")
DB_NAME = os.getenv("PG_DATABASE")
DB_USER = os.getenv("PG_USER")
DB_PASSWORD = os.getenv("PG_PASSWORD")

# Crear conexión a la base de datos
conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD
)

# Crear consulta SQL
fecha_inicio = "2025-06-16 00:00:00"
fecha_fin = "2025-06-18 23:59:59"

query = f"""
SELECT * FROM pepi
WHERE id_paciente = 'Pablo'
AND ts BETWEEN %s AND %s;
"""

# Ejecutar consulta y exportar resultados
df = pd.read_sql_query(query, conn, params=[fecha_inicio, fecha_fin])
df.to_csv("pablo_datos.csv", index=False)

# Cerrar conexión
conn.close()

print("Exportación completada: pablo_datos.csv")

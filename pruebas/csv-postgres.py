import os
import psycopg2
import csv
from datetime import datetime
from dotenv import load_dotenv

# Cargar variables de entorno desde el .env
load_dotenv()

# Obtener credenciales
DB_HOST = os.getenv("PG_HOST")
DB_PORT = os.getenv("PG_PORT")
DB_NAME = os.getenv("PG_NAME")
DB_USER = os.getenv("PG_USER")
DB_PASSWORD = os.getenv("PG_PASSWORD")

# Conexión a PostgreSQL
conn = psycopg2.connect(
    host=DB_HOST,
    port=DB_PORT,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD
)

# Crear cursor
cur = conn.cursor()

# Consulta con filtro de fechas y paciente
query = """
    SELECT * FROM tu_tabla
    WHERE ts >= %s AND ts < %s AND id_paciente = %s
"""

fecha_inicio = datetime(2025, 6, 16)
fecha_fin = datetime(2025, 6, 19)  # Exclusivo para incluir todo el 18
id_paciente = "Pablo"

cur.execute(query, (fecha_inicio, fecha_fin, id_paciente))

# Obtener resultados
rows = cur.fetchall()
column_names = [desc[0] for desc in cur.description]

# Exportar a CSV
with open("exportacion_pablo.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(column_names)
    writer.writerows(rows)

print("Exportación completada: exportacion_pablo.csv")

# Cierre
cur.close()
conn.close()

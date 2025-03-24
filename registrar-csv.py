import redis
import csv
import re
import os
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

# Configuración de Redis desde el .env
redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redis_password = os.getenv("REDIS_PASSWORD")

paciente="datossonso" #input("Ingrese el nombre del paciente: ")
redis_key = "proyecto:PEPI:{}:datos".format(paciente)

# Conectar a Redis
client = redis.Redis(host=redis_host, port=int(redis_port), password=redis_password, decode_responses=True)

# Obtener las últimas 10 instancias
raw_data = client.lrange(redis_key, 0, -1)

# Procesar los datos
processed_data = []

for entry in raw_data:
    # Eliminar caracteres 'f', 'i', 'fi' o 'if' al inicio y al final
    cleaned_entry = re.sub(r'^[fi]*|[fi]*$', '', entry)

    # Separar los grupos de 8 valores por ';'
    groups = cleaned_entry.split(";")

    for group in groups:
        # Separar los valores dentro del grupo por ','
        hex_values = group.split(",")
        if len(hex_values) == 8:  # Solo procesar grupos completos
            milivolt_values = [round(((int(value, 16) - 32768) * 5 * 1e3) / 65536, 2) for value in hex_values]
            processed_data.append(milivolt_values)

# Guardar en CSV
csv_filename = "datos_pepi.csv"
with open(csv_filename, "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["% Prueba PEPI"])
    writer.writerow(["% Paciente: {}".format(paciente)]) 
    writer.writerow(["% Tasa de muestreo: 500 Hz"]) 
    writer.writerow([])
    writer.writerow(["% Canales: 8"]) 
    writer.writerow(["% FP1", "FP2", "T1", "T2", "T3", "T4", "C3", "C4"])
    writer.writerow(["% Unidades: mV"])
    writer.writerow([]) 
    writer.writerows(processed_data)  # Datos

print(f"Archivo CSV '{csv_filename}' creado con éxito.")
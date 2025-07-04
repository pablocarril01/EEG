import os
import re
import numpy as np
import pyedflib
from dotenv import load_dotenv
import redis

# Configuración por defecto
default_frequency = 500
channel_names = ['fp1', 'fp2', 't3', 't4', 'o1', 'o2', 'c3', 'c4']

# Carga credenciales desde .env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)
redis_host = os.getenv('REDIS_HOST')
redis_port = int(os.getenv('REDIS_PORT', 6379))
redis_password = os.getenv('REDIS_PASSWORD')

# Parámetros de paciente y clave Redis
paciente = '2'
redis_key = f"proyecto:PEPI:{paciente}:datos"

# Conecta a Redis
r = redis.Redis(host=redis_host, port=redis_port, password=redis_password, decode_responses=True)

# Recupera todos los valores de la lista Redis
raw_list = r.lrange(redis_key, -3600, -1)
if not raw_list:
    raise ValueError(f"La clave Redis '{redis_key}' no contiene datos.")

# Une todos los fragmentos en un solo string
txt = ''.join(raw_list)

# 1) Eliminar espacios y caracteres de evento al inicio o fin ('i' o 'f')
entry = re.sub(r'\s+', '', txt)
entry = re.sub(r'^(?:[if])|(?:[if])$', '', entry)

# 2) Dividir por los delimitadores de secuencia 'fi' o 'if'
sequences = re.split(r'fi|if', entry)

# 3) Extraer cada grupo de valores hexadecimales y convertirlos a entero
raw_values = []
for seq in sequences:
    groups = seq.split(';')
    for group in groups:
        hex_values = [v for v in group.split(',') if v]
        # Solo procesar grupos con tantos valores como canales
        if len(hex_values) == len(channel_names):
            raw_values.append([int(val, 16) for val in hex_values])

if not raw_values:
    raise ValueError("No se encontraron grupos válidos de valores hexadecimales.")

# Convertir a numpy array, restar offset y reorganizar en matriz (n_channels, n_samples)
OFFSET = 32768
arr = np.array(raw_values, dtype=int).T - OFFSET

# Generar archivo EDF
edf_path = os.path.join(os.path.dirname(__file__), f"paciente_{paciente}.edf")
n_samples = arr.shape[1]

# Metadatos de canales
phys_min = float(arr.min())
phys_max = float(arr.max())
channel_info = []
for name in channel_names:
    channel_info.append({
        'label': name,
        'dimension': 'uV',
        'sample_frequency': default_frequency,
        'physical_min': phys_min,
        'physical_max': phys_max,
        'digital_min': -32768,
        'digital_max': 32767,
        'transducer': '',
        'prefilter': ''
    })

with pyedflib.EdfWriter(edf_path, n_channels=len(channel_names), file_type=pyedflib.FILETYPE_EDFPLUS) as writer:
    writer.setSignalHeaders(channel_info)
    writer.writeSamples(arr)

print(f"EDF generado: {edf_path} con {n_samples} muestras a {default_frequency} Hz")

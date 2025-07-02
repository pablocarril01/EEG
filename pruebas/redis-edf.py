import os
import re
import numpy as np
import pyedflib
from dotenv import load_dotenv
import redis

# Configuración por defecto
DEFAULT_FREQUENCY = 500
channel_names = ['fp1','fp2','t3','t4','o1','o2','c3','c4']

# Carga credenciales desde .env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)
redis_host = os.getenv('REDIS_HOST')
redis_port = int(os.getenv('REDIS_PORT', 6379))
redis_password = os.getenv('REDIS_PASSWORD')

# Parámetros de paciente y clave Redis
paciente = '5'
redis_key = f"proyecto:PEPI:{paciente}:datos"

# Conecta a Redis
r = redis.Redis(host=redis_host, port=redis_port, password=redis_password, decode_responses=True)

# Recupera todos los valores de la lista Redis
raw_list = r.lrange(redis_key, 0, -1)
if not raw_list:
    raise ValueError(f"La clave Redis '{redis_key}' no contiene datos.")

# Une todos los fragmentos en un solo string
txt = ''.join(raw_list)

# Extrae valores hexadecimales: split por comas y punto y coma
def_parts = re.split(r'[;,]', txt)

# Limpia espacios y filtra cadenas vacías o marcadores de evento (fi, if, i, f)
junk = {'fi', 'if', 'i', 'f'}
cleaned = []
for part in def_parts:
    p = part.strip()
    if not p or p.lower() in junk:
        continue
    if not re.fullmatch(r'[0-9A-Fa-f]+', p):
        continue
    cleaned.append(p)
hex_vals = cleaned

# Verifica y ajusta si no divisible por número de canales
n_vals = len(hex_vals)
extra = n_vals % len(channel_names)
if extra != 0:
    print(f"Advertencia: {n_vals} valores hex no divisible por {len(channel_names)}. Se eliminarán los últimos {extra} valores.")
    hex_vals = hex_vals[:-extra]

# Conversión hexadecimal a entero y resta de offset
OFFSET = 32768
decimal_vals = [int(v, 16) - OFFSET for v in hex_vals]

# Forma matriz (n_channels, n_samples) con los valores resultantes
arr = np.array(decimal_vals).reshape(len(channel_names), -1)

# Generar EDF
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
        'sample_frequency': DEFAULT_FREQUENCY,
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

print(f"EDF generado: {edf_path} con {n_samples} muestras a {DEFAULT_FREQUENCY} Hz")

import os
import argparse
import psycopg2
import csv
from datetime import datetime

def export_to_csv(id_paciente, start_time, end_time, output_file):
    # Leer credenciales de entorno
    db_params = {
        'host': os.getenv('PG_HOST', '127.0.0.1'),
        'port': os.getenv('PG_PORT', '5432'),
        'dbname': os.getenv('PG_DATABASE', 'pepi'),
        'user': os.getenv('PG_USER', 'pepi_user'),
        'password': os.getenv('PG_PASSWORD', ''),
    }

    # Conectar a la base de datos
    conn = psycopg2.connect(**db_params)
    cursor = conn.cursor()

    # Consulta
    query = """
        SELECT ts, id, id_paciente, fp1, fp2, t3, t4, o1, o2, c3, c4, evento
        FROM pepi
        WHERE id_paciente = %s
          AND ts BETWEEN %s AND %s
        ORDER BY ts;
    """
    cursor.execute(query, (id_paciente, start_time, end_time))
    rows = cursor.fetchall()

    # Los nombres de las columnas
    column_names = [desc[0] for desc in cursor.description]

    # Escribir CSV
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(column_names)
        writer.writerows(rows)

    print(f"✅ Export completed: {len(rows)} rows written to {output_file}")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export patient EEG data to CSV")
    parser.add_argument("--id-paciente", required=True, help="ID del paciente a filtrar")
    parser.add_argument("--start", required=True, help="Fecha inicio (YYYY-MM-DD HH:MM:SS)")
    parser.add_argument("--end", required=True, help="Fecha fin (YYYY-MM-DD HH:MM:SS)")
    parser.add_argument("--output", default="export-postgres.csv", help="Nombre del archivo CSV de salida")

    args = parser.parse_args()

    # Convertir fechas
    try:
        start_dt = datetime.fromisoformat(args.start)
        end_dt = datetime.fromisoformat(args.end)
    except ValueError as e:
        print(f"❌ Error parsing dates: {e}")
        exit(1)

    export_to_csv(args.id_paciente, start_dt, end_dt, args.output)

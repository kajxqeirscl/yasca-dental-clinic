"""
import_rimahalloum.py
--------------------
Reads the exported rimahalloum.csv and imports all data into a target
PostgreSQL database (Railway).

Prerequisites:
  1. Railway PostgreSQL service is running
  2. Django migrations have been run on the target DB:
       python manage.py migrate_schemas --shared --noinput
       python manage.py migrate_schemas --noinput
  3. The rimahalloum tenant has been created on the target DB
       (via create_tenant.py or the registration endpoint)
  4. psycopg2-binary is installed: pip install psycopg2-binary

Usage:
  python import_rimahalloum.py <path_to_csv> <target_database_url>

Example:
  python import_rimahalloum.py "venv/CSVs rimahalloum/rimahalloum.csv" \
    "postgresql://postgres:PASSWORD@HOST/railway"
"""

import csv
import json
import sys
import psycopg2

SCHEMA = 'rimahalloum'

# Insert order matters — dependencies must come before dependants
TABLE_ORDER = [
    'api_customuser',               # no FK deps on other tenant tables
    'api_customuser_user_permissions',  # FK -> api_customuser, auth_permission
    'api_patient',                  # no FK deps
    'api_treatmenttype',            # FK -> api_customuser (doctor)
    'api_treatment',                # FK -> api_patient, api_customuser, api_treatmenttype
    'api_appointment',              # FK -> api_patient, api_customuser, api_treatment
    'api_payment',                  # FK -> api_patient, api_treatment
    'api_anamnesis',                # FK -> api_patient
    'api_clinicsettings',           # no FK deps
    'api_document',                 # FK -> api_patient, api_customuser
    'api_auditlog',                 # FK -> api_customuser (content_type nulled out below)
]


def load_csv(filepath: str) -> dict[str, list[dict]]:
    """Parse the two-column (tbl, data) CSV exported from Supabase."""
    data: dict[str, list[dict]] = {}
    with open(filepath, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tbl = row['tbl']
            row_data = json.loads(row['data'])
            data.setdefault(tbl, []).append(row_data)
    return data


def insert_rows(cur, schema: str, table: str, rows: list[dict]) -> None:
    """Upsert rows into schema.table preserving original IDs."""
    if not rows:
        return

    for row in rows:
        # api_auditlog references django_content_type which lives in the
        # public schema and may have different IDs in the new DB.
        # Null it out to avoid FK violations — audit logs are still useful
        # without the content_type link.
        if table == 'api_auditlog':
            row = {**row, 'content_type_id': None, 'object_id': None}

        columns = list(row.keys())
        values = [json.dumps(row[c]) if isinstance(row[c], (dict, list)) else row[c] for c in columns]
        col_str = ', '.join(f'"{c}"' for c in columns)
        placeholders = ', '.join(['%s'] * len(values))
        update_str = ', '.join(
            f'"{c}" = EXCLUDED."{c}"' for c in columns if c != 'id'
        )

        sql = (
            f'INSERT INTO "{schema}"."{table}" ({col_str}) '
            f'VALUES ({placeholders}) '
            f'ON CONFLICT (id) DO UPDATE SET {update_str}'
        )
        cur.execute(sql, values)


def reset_sequence(cur, schema: str, table: str, rows: list[dict]) -> None:
    """Advance the id sequence past the highest imported id."""
    if not rows:
        return
    ids = [r['id'] for r in rows if isinstance(r.get('id'), int)]
    if not ids:
        return
    max_id = max(ids)
    seq = f'{table}_id_seq'
    cur.execute(f'SELECT setval(\'"{schema}"."{seq}"\', %s, true)', (max_id,))


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    csv_path = sys.argv[1]
    db_url = sys.argv[2]

    print(f'Loading {csv_path} ...')
    data = load_csv(csv_path)
    for tbl, rows in data.items():
        print(f'  {tbl}: {len(rows)} rows')

    print(f'\nConnecting to target database ...')
    conn = psycopg2.connect(db_url)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            for table in TABLE_ORDER:
                rows = data.get(table, [])
                if not rows:
                    print(f'  SKIP  {table} (empty)')
                    continue
                print(f'  INSERT {len(rows):>4} rows  ->  {SCHEMA}.{table}')
                insert_rows(cur, SCHEMA, table, rows)
                reset_sequence(cur, SCHEMA, table, rows)

        conn.commit()
        print('\n[OK]  Import complete.')

    except Exception as exc:
        conn.rollback()
        print(f'\n[ERROR]  Error: {exc}')
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    main()

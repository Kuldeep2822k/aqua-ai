import psycopg2
from config import DB_CONFIG


def check_data():
    conn = None
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG.host,
            port=DB_CONFIG.port,
            database=DB_CONFIG.database,
            user=DB_CONFIG.username,
            password=DB_CONFIG.password,
        )
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM locations")
            loc_count = cursor.fetchone()[0]

            cursor.execute("SELECT parameter_code FROM water_quality_parameters")
            params = cursor.fetchall()
            print(f"Parameters in DB: {[p[0] for p in params]}")

            cursor.execute("SELECT COUNT(*) FROM water_quality_readings")
            reading_count = cursor.fetchone()[0]

        print(f"Locations: {loc_count}")
        print(f"Readings: {reading_count}")

        if reading_count > 0:
            print("SUCCESS: Data found in database.")
        else:
            print("FAILURE: No data found in readings table.")
    except Exception as e:
        print(f"Error checking DB: {e}")
        raise
    finally:
        if conn is not None:
            conn.close()


if __name__ == "__main__":
    check_data()

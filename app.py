from flask import Flask, render_template, jsonify
import psycopg2
import geojson

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_geojson_data')
def get_geojson_data():
    # Koneksi ke database PostgreSQL (pastikan Anda mengganti dengan kredensial yang benar)
    conn = psycopg2.connect(
        dbname="nama_database", 
        user="nama_user", 
        password="pw_user_database", 
        host="localhost", 
        port="5432"
    )
    cursor = conn.cursor()

    # Query untuk mengambil data geospasial dalam format GeoJSON
    cursor.execute("""
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', jsonb_agg(
                jsonb_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(geom)::jsonb,
                    'properties', jsonb_build_object(
                        'nama_objek', nama_objek,
                        'jenis_obje', jenis_obje,
                        'alamat', alamat,
                        'deskripsi', deskripsi
                    )
                )
            )
        )
        FROM "pariwisata lampung";
    """)

    geojson_data = cursor.fetchone()[0]  # Ambil hasil query
    cursor.close()
    conn.close()

    return jsonify(geojson_data)

if __name__ == '__main__':
    app.run(debug=True)

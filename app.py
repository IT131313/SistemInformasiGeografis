from flask import Flask, render_template, jsonify
import psycopg2
import geojson

app = Flask(__name__)

# Koneksi ke database PostgreSQL
def get_db_connection():
    conn = psycopg2.connect(
        dbname="sig", 
        user="postgres", 
        password="Roman5432", 
        host="localhost", 
        port="5432"
    )
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_geojson')
def get_geojson():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Ambil data objek wisata dalam format GeoJSON
    cursor.execute("""
        SELECT gid, nama_objek, jenis_obje, alamat, deskripsi, ST_AsGeoJSON(geom) AS geojson
        FROM "pariwisata lampung";
    """)
    
    rows = cursor.fetchall()
    
    # Membentuk GeoJSON
    features = []
    for row in rows:
        gid, nama_objek, jenis_obje, alamat, deskripsi, geojson_str = row
        feature = {
            "type": "Feature",
            "properties": {
                "gid": gid,
                "nama_objek": nama_objek,
                "jenis_obje": jenis_obje,
                "alamat": alamat,
                "deskripsi": deskripsi
            },
            "geometry": geojson.loads(geojson_str)
        }
        features.append(feature)
    
    geojson_data = {
        "type": "FeatureCollection",
        "features": features
    }

    cursor.close()
    conn.close()
    
    return jsonify(geojson_data)

if __name__ == '__main__':
    app.run(debug=True)

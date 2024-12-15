from flask import Flask, render_template, jsonify
import psycopg2
from config import DATABASE_CONFIG

app = Flask(__name__)

def get_db_connection():
    """Create and return a database connection"""
    return psycopg2.connect(**DATABASE_CONFIG)

def fetch_geojson_from_db():
    """Fetch GeoJSON data from database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
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
    """
    
    cursor.execute(query)
    data = cursor.fetchone()[0]
    
    cursor.close()
    conn.close()
    
    return data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_geojson_data')
def get_geojson_data():
    try:
        geojson_data = fetch_geojson_from_db()
        return jsonify(geojson_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

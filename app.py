from flask import Flask, render_template, jsonify, request
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
        WITH point_features AS (
            SELECT jsonb_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(geom)::jsonb,
                'properties', jsonb_build_object(
                    'nama_objek', nama_objek,
                    'jenis_obje', jenis_obje,
                    'alamat', alamat,
                    'deskripsi', deskripsi,
                    'geometry_type', 'Point'
                )
            ) AS feature
            FROM pariwisata_lampung
            WHERE geom IS NOT NULL
        ),
        polygon_features AS (
            SELECT jsonb_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(polygon)::jsonb,
                'properties', jsonb_build_object(
                    'nama_objek', nama_objek,
                    'jenis_obje', jenis_obje,
                    'alamat', alamat,
                    'deskripsi', deskripsi,
                    'geometry_type', 'Polygon'
                )
            ) AS feature
            FROM pariwisata_lampung
            WHERE polygon IS NOT NULL
        )
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', jsonb_agg(feature)
        )
        FROM (
            SELECT feature FROM point_features
            UNION ALL
            SELECT feature FROM polygon_features
        ) AS all_features;
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

@app.route('/add_point', methods=['POST'])
def add_point():
    try:
        # Get data from the request
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        nama_objek = data.get('nama_objek')
        jenis_obje = data.get('jenis_obje')
        alamat = data.get('alamat')
        deskripsi = data.get('deskripsi')

        # Validate the data
        if not (latitude and longitude and nama_objek and jenis_obje and alamat and deskripsi):
            return jsonify({'success': False, 'error': 'All fields are required.'}), 400

        # Insert into the database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO pariwisata_lampung (geom, nama_objek, jenis_obje, alamat, deskripsi)
            VALUES (
                ST_SetSRID(ST_MakePoint(%s, %s), 4326),
                %s, %s, %s, %s
            )
        """
        cursor.execute(query, (longitude, latitude, nama_objek, jenis_obje, alamat, deskripsi))
        conn.commit()

        cursor.close()
        conn.close()

        # Return success response
        return jsonify({'success': True, 'message': 'Point added successfully.'}), 200
    except Exception as e:
        # Log the error and return an error response
        print(f"Error adding point: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Route to store user location
@app.route('/store-location', methods=['POST'])
def store_location():
    data = request.get_json()
    if data and 'latitude' in data and 'longitude' in data:
        latitude = data['latitude']
        longitude = data['longitude']

        # Log or store the data
        print(f"Location received: {latitude}, {longitude}")

        # Optional: Store in database (PostgreSQL)
        # save_location_to_db(latitude, longitude)

        return jsonify({"message": "Location stored successfully"}), 200
    return jsonify({"error": "Invalid location data"}), 400

if __name__ == '__main__':
    app.run(debug=True)

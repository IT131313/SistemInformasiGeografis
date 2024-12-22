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

@app.route('/add_polygon', methods=['POST'])
def add_polygon():
    try:
        data = request.json
        polygon = data.get('polygon')
        centroid = data.get('centroid')
        nama_objek = data.get('nama_objek')
        jenis_obje = data.get('jenis_obje')
        alamat = data.get('alamat')
        deskripsi = data.get('deskripsi')

        if not polygon or not isinstance(polygon, list) or len(polygon[0]) < 4:
            return jsonify({"error": "A polygon must have at least 4 points, including the closing point."}), 400

        # Convert the polygon into WKT format
        polygon_wkt = f"POLYGON(({','.join(f'{lng} {lat}' for lng, lat in polygon[0])}))"

        # Convert the centroid into WKT POINT format
        centroid_wkt = f"POINT({centroid[0]} {centroid[1]})"

        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert the polygon and its centroid into the database
        query = """
            INSERT INTO pariwisata_lampung (objectid, polygon, geom, nama_objek, jenis_obje, alamat, deskripsi)
            VALUES (
                DEFAULT,
                ST_GeomFromText(%s, 4326),
                ST_GeomFromText(%s, 4326),
                %s, %s, %s, %s
            ) RETURNING objectid;
        """
        cursor.execute(query, (polygon_wkt, centroid_wkt, nama_objek, jenis_obje, alamat, deskripsi))
        conn.commit()

        objectid = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        return jsonify({"success": True, "objectid": objectid, "polygon": polygon_wkt, "centroid": centroid_wkt}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

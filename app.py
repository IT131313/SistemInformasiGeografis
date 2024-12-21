from flask import Flask, render_template, jsonify, redirect, url_for, session, request
import psycopg2
from config import DATABASE_CONFIG
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_jwt_extended import JWTManager, create_access_token
from flask_bcrypt import Bcrypt
import secrets
import datetime

app = Flask(__name__)
CORS(app)
app.secret_key = 'your_secret_key'  # Tambahkan secret key untuk sesi

bcrypt = Bcrypt(app)
jwt = JWTManager(app)
mail = Mail(app)

# Konfigurasi Email
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'ihsantriyadi13@gmail.com'  
app.config['MAIL_PASSWORD'] = 'dlie rvjs yizp dgdd'     
mail = Mail(app)

# Fungsi untuk mendapatkan koneksi ke database
def get_db_connection():
    return psycopg2.connect(**DATABASE_CONFIG)

# Fungsi untuk mengambil GeoJSON dari database
def fetch_geojson_from_db():
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

# Rute utama
@app.route('/')
def home():
    return redirect(url_for('index'))  # Arahkan ke halaman utama jika sudah login

# Rute halaman utama (index)
@app.route('/index')
def index():
    username = session.get('username')
    return render_template('index.html', username=username)

# Rute untuk GeoJSON data
@app.route('/get_geojson_data')
def get_geojson_data():
    try:
        # Ambil data GeoJSON dari database
        geojson_data = fetch_geojson_from_db()
        return jsonify(geojson_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Rute untuk halaman registrasi
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        hashed_password = generate_password_hash(password)

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO "user" (username, password, email)
                VALUES (%s, %s, %s)
            """, (username, hashed_password, email))

            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({'message': 'Registration successful!'}), 201
        except Exception as e:
            print(f"Error: {e}") 
            return jsonify({'error': f"An error occurred: {str(e)}"}), 500

    return render_template('register.html')

# Rute untuk halaman login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute('SELECT id, password, username FROM "user" WHERE username = %s', (username,))
            user = cursor.fetchone()

            if user and check_password_hash(user[1], password):
                # Generate access token
                access_token = create_access_token(identity={
                    'user_id': user[0],
                    'username': user[2]
                })
                
                # Simpan user_id ke dalam session
                session['user_id'] = user[0]
                session['username'] = user[2]
                session['access_token'] = access_token

                return jsonify({
                    'status': 'success',
                    'access_token': access_token,
                    'message': 'Login successful',
                    'redirect_url': '/index'
                }), 200
            else:
                return jsonify({'error': 'Invalid username or password'}), 401

        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()
            conn.close()

    return render_template('login.html')


# Rute untuk forgot password
@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Cek apakah email ada di database
        cursor.execute('SELECT id, username FROM "user" WHERE email = %s', (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Email not found'}), 404

        # Generate token reset password
        reset_token = secrets.token_urlsafe(32)
        reset_token_expiry = datetime.datetime.now() + datetime.timedelta(hours=24)

        # Simpan token di database
        cursor.execute("""
            UPDATE "user" 
            SET reset_token = %s, reset_token_expiry = %s 
            WHERE email = %s
        """, (reset_token, reset_token_expiry, email))

        conn.commit()

        # Kirim email reset password
        reset_url = f"http://localhost:5000/login?token={reset_token}"
        msg = Message(
            'Password Reset Request',
            sender=app.config['MAIL_USERNAME'],
            recipients=[email]
        )
        msg.body = f"""
        Untuk mereset password Anda, klik link berikut:
        {reset_url}

        Link ini akan kadaluarsa dalam 24 jam.
        
        Jika Anda tidak meminta reset password, abaikan email ini.
        """
        
        mail.send(msg)
        return jsonify({'message': 'Password reset instructions sent to email'}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Route untuk reset password
@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    if not all([token, new_password]):
        return jsonify({'error': 'All fields are required'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Cek validitas token
        cursor.execute("""
            SELECT id FROM "user" 
            WHERE reset_token = %s 
            AND reset_token_expiry > NOW()
        """, (token,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Invalid or expired reset token'}), 400

        # Update password
        hashed_password = generate_password_hash(new_password)
        cursor.execute("""
            UPDATE "user" 
            SET password = %s, 
                reset_token = NULL, 
                reset_token_expiry = NULL 
            WHERE id = %s
        """, (hashed_password, user[0]))

        conn.commit()
        return jsonify({'message': 'Password has been reset successfully'}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Rute untuk logout
@app.route('/logout')
def logout():
    # Hapus semua data session
    session.clear()
    return redirect(url_for('login'))

@app.route('/add_location', methods=['POST'])
def add_location():
    data = request.get_json()
    nama_objek = data.get('nama_objek')
    jenis_objek = data.get('jenis_objek')
    alamat = data.get('alamat')
    deskripsi = data.get('deskripsi')
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    # Simpan ke database
    if 'access_token' not in session:
        return jsonify({'error': 'No Access Token'})
    else:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
            '''
                INSERT INTO locations (nama_objek, jenis_objek, alamat, deskripsi, latitude, longitude)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''',
                (nama_objek, jenis_objek, alamat, deskripsi, latitude, longitude)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({'status': 'success', 'message': 'Data berhasil ditambahkan!'}), 200
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
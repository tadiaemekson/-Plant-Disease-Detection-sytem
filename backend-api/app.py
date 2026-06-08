import os
import re
import sys
import uuid
import json
import datetime
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import sqlite3
import hashlib

# Add sibling directory ml-model to search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../ml-model')))
from model import predict_image
import utils

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

# -------------------------------------------------------------
# Database Configuration & Connection (Dual Postgres / SQLite)
# -------------------------------------------------------------
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "plant_disease")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "postgres")

db_connection = None
USE_SQLITE = False
SQLITE_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../database/plant_disease.db'))

def get_db_connection():
    global db_connection, USE_SQLITE
    
    if USE_SQLITE:
        try:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            conn.row_factory = sqlite3.Row
            return conn
        except Exception as e:
            print(f"[SQLite Error] Could not connect to SQLite: {e}")
            return None
            
    # Try PostgreSQL connection
    if db_connection is not None and not db_connection.closed:
        return db_connection
    try:
        db_connection = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            connect_timeout=2
        )
        return db_connection
    except Exception as e:
        print(f"[DB Warning] Could not connect to PostgreSQL: {e}")
        print("[DB] Falling back to SQLite local database.")
        USE_SQLITE = True
        os.makedirs(os.path.dirname(SQLITE_DB_PATH), exist_ok=True)
        try:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            conn.row_factory = sqlite3.Row
            return conn
        except Exception as se:
            print(f"[SQLite Error] Could not connect to SQLite: {se}")
            return None

# -------------------------------------------------------------
# Helper Functions for Parsing & Seeding
# -------------------------------------------------------------
def parse_prevention_html(raw_html):
    """
    Parses the legacy HTML text in utils.disease_dic into structured data fields:
    crop, disease_name, cause, and a list of prevention steps.
    """
    crop_match = re.search(r'Crop</b>:\s*([^<]+)', raw_html, re.IGNORECASE)
    crop = crop_match.group(1).strip() if crop_match else "Unknown"
    
    disease_match = re.search(r'Disease:\s*([^<]+)', raw_html, re.IGNORECASE)
    disease_name = disease_match.group(1).strip() if disease_match else "Healthy"
    
    cause_match = re.search(r'Cause of disease:\s*([\s\S]*?)(?:How to prevent/cure|$)', raw_html, re.IGNORECASE)
    cause = ""
    if cause_match:
        cause_text = cause_match.group(1)
        cause_text = re.sub(r'<br\s*/?>', '\n', cause_text, flags=re.IGNORECASE)
        cause_text = re.sub(r'<\/?b>', '', cause_text, flags=re.IGNORECASE)
        cause = re.sub(r'\n\s*\n+', '\n', cause_text).strip()
    else:
        cause = "No active disease or cause details available." if "healthy" in disease_name.lower() or "no disease" in disease_name.lower() else "Information not available."
        
    prev_match = re.search(r'How to prevent/cure[\s\S]*?:\s*([\s\S]*)$', raw_html, re.IGNORECASE)
    prevention_steps = []
    if prev_match:
        prev_text = prev_match.group(1)
        prev_text = re.sub(r'<\/?b>', '', prev_text, flags=re.IGNORECASE)
        steps = re.split(r'<br\s*/?>|\n', prev_text, flags=re.IGNORECASE)
        for step in steps:
            cleaned = step.strip()
            cleaned = re.sub(r'^\d+\.\s*|^[a-zA-Z]\.\s*', '', cleaned)
            if cleaned:
                prevention_steps.append(cleaned)
    else:
        cleaned_text = re.sub(r'<[^>]+>', '', raw_html).strip()
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
        prevention_steps = [cleaned_text]
        
    return crop, disease_name, cause, prevention_steps

def init_db_and_seed():
    """
    Initializes database tables and seeds the treatments table.
    Works for both PostgreSQL and SQLite fallback.
    """
    conn = get_db_connection()
    if conn is None:
        print("[DB Error] Could not initialize database database. Fallback to offline dict.")
        return
        
    try:
        if USE_SQLITE:
            # SQLite Table Initialization
            cur = conn.cursor()
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS treatments (
                disease_key VARCHAR(100) PRIMARY KEY,
                crop VARCHAR(100) NOT NULL,
                disease_name VARCHAR(250) NOT NULL,
                cause TEXT,
                prevention_steps TEXT NOT NULL, -- JSON String
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) REFERENCES users(id),
                image_path VARCHAR(500) NOT NULL,
                crop_type VARCHAR(100) NOT NULL,
                predicted_disease VARCHAR(100) REFERENCES treatments(disease_key),
                confidence NUMERIC(5, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS farms (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                crop_type VARCHAR(100) NOT NULL,
                area_size VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS support_tickets (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
                subject VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            
            # Check Seeding
            cur.execute("SELECT COUNT(*) FROM treatments;")
            count = cur.fetchone()[0]
            if count == 0:
                print("[SQLite] Seeding treatments from local dictionary...")
                for key, raw_html in utils.disease_dic.items():
                    crop, disease_name, cause, prevention_steps = parse_prevention_html(raw_html)
                    cur.execute("""
                        INSERT INTO treatments (disease_key, crop, disease_name, cause, prevention_steps)
                        VALUES (?, ?, ?, ?, ?);
                    """, (key, crop, disease_name, cause, json.dumps(prevention_steps)))
                conn.commit()
                print(f"[SQLite] Seeding completed: {len(utils.disease_dic)} items.")
            else:
                print(f"[SQLite] Local database already initialized ({count} treatments).")
            conn.close()
        else:
            # PostgreSQL Table Initialization
            with conn.cursor() as cur:
                cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    username VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """)
                cur.execute("""
                CREATE TABLE IF NOT EXISTS treatments (
                    disease_key VARCHAR(100) PRIMARY KEY,
                    crop VARCHAR(100) NOT NULL,
                    disease_name VARCHAR(250) NOT NULL,
                    cause TEXT,
                    prevention_steps TEXT[] NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """)
                cur.execute("""
                CREATE TABLE IF NOT EXISTS scans (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    image_path VARCHAR(500) NOT NULL,
                    crop_type VARCHAR(100) NOT NULL,
                    predicted_disease VARCHAR(100) REFERENCES treatments(disease_key),
                    confidence NUMERIC(5, 2) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """)
                cur.execute("""
                CREATE TABLE IF NOT EXISTS farms (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(100) NOT NULL,
                    crop_type VARCHAR(100) NOT NULL,
                    area_size VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """)
                cur.execute("""
                CREATE TABLE IF NOT EXISTS support_tickets (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    subject VARCHAR(200) NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                """)
                
                # Check Seeding
                cur.execute("SELECT COUNT(*) FROM treatments;")
                count = cur.fetchone()[0]
                if count == 0:
                    print("[PostgreSQL] Seeding treatments from local dictionary...")
                    for key, raw_html in utils.disease_dic.items():
                        crop, disease_name, cause, prevention_steps = parse_prevention_html(raw_html)
                        cur.execute("""
                            INSERT INTO treatments (disease_key, crop, disease_name, cause, prevention_steps)
                            VALUES (%s, %s, %s, %s, %s)
                            ON CONFLICT (disease_key) DO NOTHING;
                        """, (key, crop, disease_name, cause, prevention_steps))
                    conn.commit()
                    print(f"[PostgreSQL] Seeding completed: {len(utils.disease_dic)} items.")
                else:
                    print(f"[PostgreSQL] Database already initialized ({count} treatments).")
                    
    except Exception as e:
        print(f"[DB Error] Failed to initialize/seed database: {e}")
        if conn and not USE_SQLITE:
            conn.rollback()

# Run database setup on startup
init_db_and_seed()

# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/health', methods=['GET'])
def health():
    """
    Returns server status, DB connection status, and model verification.
    """
    conn = get_db_connection()
    if conn is None:
        db_status = "offline"
    else:
        db_status = f"connected ({'SQLite' if USE_SQLITE else 'PostgreSQL'})"
        if USE_SQLITE:
            conn.close()
            
    return jsonify({
        "status": "healthy",
        "database": db_status,
        "model_loaded": True,
        "timestamp": datetime.datetime.now().isoformat()
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    """
    POST multi-part request. Classifies leaf image, logs scan to DB, and returns prediction details.
    """
    try:
        image_file = request.files.get('image') or request.files.get('file')
        user_id = request.form.get('user_id')
        
        if image_file is None:
            return jsonify({
                "error": "No image file uploaded. Use the 'image' or 'file' field."
            }), 400

        # Read image bytes and run prediction
        img_bytes = image_file.read()
        prediction_key, confidence = predict_image(img_bytes)
        
        # Save image locally in static uploads for reference
        os.makedirs('./static/uploads', exist_ok=True)
        timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp_str}_{image_file.filename or 'upload.jpg'}"
        save_path = os.path.join('./static/uploads', filename)
        
        with open(save_path, 'wb') as f:
            f.write(img_bytes)
            
        relative_path = f"static/uploads/{filename}"

        # Fetch treatments (from DB or fallback)
        crop = "Unknown"
        disease_name = "Unknown"
        cause = "Information not available."
        prevention_steps = []
        
        conn = get_db_connection()
        db_saved = False
        
        if conn is not None:
            try:
                if USE_SQLITE:
                    cur = conn.cursor()
                    cur.execute("""
                        SELECT crop, disease_name, cause, prevention_steps 
                        FROM treatments 
                        WHERE disease_key = ?;
                    """, (prediction_key,))
                    row = cur.fetchone()
                    if row:
                        crop = row['crop']
                        disease_name = row['disease_name']
                        cause = row['cause']
                        prevention_steps = json.loads(row['prevention_steps'])
                    else:
                        raw_html = utils.disease_dic.get(prediction_key)
                        if raw_html:
                            crop, disease_name, cause, prevention_steps = parse_prevention_html(raw_html)
                            
                    # Log scan to SQLite
                    scan_uuid = str(uuid.uuid4())
                    cur.execute("""
                        INSERT INTO scans (id, user_id, image_path, crop_type, predicted_disease, confidence)
                        VALUES (?, ?, ?, ?, ?, ?);
                    """, (scan_uuid, user_id, relative_path, crop, prediction_key, confidence))
                    conn.commit()
                    db_saved = True
                    conn.close()
                else:
                    # PostgreSQL Connection
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute("""
                            SELECT crop, disease_name, cause, prevention_steps 
                            FROM treatments 
                            WHERE disease_key = %s;
                        """, (prediction_key,))
                        row = cur.fetchone()
                        
                        if row:
                            crop = row['crop']
                            disease_name = row['disease_name']
                            cause = row['cause']
                            prevention_steps = row['prevention_steps']
                        else:
                            raw_html = utils.disease_dic.get(prediction_key)
                            if raw_html:
                                crop, disease_name, cause, prevention_steps = parse_prevention_html(raw_html)
                                
                        cur.execute("""
                            INSERT INTO scans (user_id, image_path, crop_type, predicted_disease, confidence)
                            VALUES (%s, %s, %s, %s, %s)
                            RETURNING id;
                        """, (user_id, relative_path, crop, prediction_key, confidence))
                        conn.commit()
                        db_saved = True
            except Exception as e:
                print(f"[DB Error] Failed to log scan / fetch treatments: {e}")
                if not USE_SQLITE:
                    conn.rollback()

        # Fallback to local dict parsing if DB is disconnected
        if not prevention_steps:
            raw_html = utils.disease_dic.get(prediction_key)
            if raw_html:
                crop, disease_name, cause, prevention_steps = parse_prevention_html(raw_html)
            else:
                prevention_steps = ["No prevention tips available for this class."]

        return jsonify({
            "prediction": prediction_key,
            "confidence": round(confidence, 2),
            "crop": crop,
            "disease": disease_name,
            "cause": cause,
            "prevention": prevention_steps,
            "image_url": relative_path,
            "logged_to_db": db_saved,
            "db_type": "SQLite" if USE_SQLITE else "PostgreSQL"
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
        }), 500

@app.route('/scans', methods=['GET'])
def get_scans():
    """
    Retrieves history of scans from database.
    """
    user_id = request.args.get('user_id')
    conn = get_db_connection()
    if conn is None:
        return jsonify({
            "error": "Database is not connected. History unavailable."
        }), 503
        
    try:
        scans_list = []
        if USE_SQLITE:
            cur = conn.cursor()
            if user_id:
                cur.execute("""
                    SELECT s.id, s.image_path, s.crop_type, s.predicted_disease, 
                           s.confidence, s.created_at, t.disease_name
                    FROM scans s
                    LEFT JOIN treatments t ON s.predicted_disease = t.disease_key
                    WHERE s.user_id = ?
                    ORDER BY s.created_at DESC;
                """, (user_id,))
            else:
                cur.execute("""
                    SELECT s.id, s.image_path, s.crop_type, s.predicted_disease, 
                           s.confidence, s.created_at, t.disease_name
                    FROM scans s
                    LEFT JOIN treatments t ON s.predicted_disease = t.disease_key
                    ORDER BY s.created_at DESC
                    LIMIT 50;
                """)
            rows = cur.fetchall()
            for r in rows:
                scans_list.append({
                    "id": r["id"],
                    "image_path": r["image_path"],
                    "crop_type": r["crop_type"],
                    "predicted_disease": r["predicted_disease"],
                    "confidence": float(r["confidence"]),
                    "created_at": r["created_at"],
                    "disease_name": r["disease_name"]
                })
            conn.close()
        else:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if user_id:
                    cur.execute("""
                        SELECT s.id, s.image_path, s.crop_type, s.predicted_disease, 
                               s.confidence, s.created_at, t.disease_name
                        FROM scans s
                        LEFT JOIN treatments t ON s.predicted_disease = t.disease_key
                        WHERE s.user_id = %s
                        ORDER BY s.created_at DESC;
                    """, (user_id,))
                else:
                    cur.execute("""
                        SELECT s.id, s.image_path, s.crop_type, s.predicted_disease, 
                               s.confidence, s.created_at, t.disease_name
                        FROM scans s
                        LEFT JOIN treatments t ON s.predicted_disease = t.disease_key
                        ORDER BY s.created_at DESC
                        LIMIT 50;
                    """)
                scans_list = cur.fetchall()
                
        return jsonify({
            "scans": scans_list
        })
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# -------------------------------------------------------------
# User Authentication & Profiles Endpoints
# -------------------------------------------------------------
def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json or {}
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({"error": "Username, email and password are required."}), 400
            
        password_hash = hash_password(password)
        user_uuid = str(uuid.uuid4())
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database is not connected. Registration failed."}), 503
            
        try:
            if USE_SQLITE:
                cur = conn.cursor()
                # Check if email exists
                cur.execute("SELECT id FROM users WHERE email = ?;", (email,))
                if cur.fetchone():
                    conn.close()
                    return jsonify({"error": "Email is already registered."}), 409
                    
                cur.execute("""
                    INSERT INTO users (id, username, email, password_hash)
                    VALUES (?, ?, ?, ?);
                """, (user_uuid, username, email, password_hash))
                conn.commit()
                conn.close()
            else:
                with conn.cursor() as cur:
                    cur.execute("SELECT id FROM users WHERE email = %s;", (email,))
                    if cur.fetchone():
                        return jsonify({"error": "Email is already registered."}), 409
                        
                    cur.execute("""
                        INSERT INTO users (id, username, email, password_hash)
                        VALUES (%s, %s, %s, %s);
                    """, (user_uuid, username, email, password_hash))
                    conn.commit()
        except Exception as db_err:
            if not USE_SQLITE:
                conn.rollback()
            return jsonify({"error": f"Database error during registration: {db_err}"}), 500
            
        return jsonify({
            "success": True,
            "user": {
                "id": user_uuid,
                "username": username,
                "email": email
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json or {}
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400
            
        password_hash = hash_password(password)
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database is not connected. Login failed."}), 503
            
        user_data = None
        try:
            if USE_SQLITE:
                cur = conn.cursor()
                cur.execute("""
                    SELECT id, username, email, password_hash FROM users WHERE email = ?;
                """, (email,))
                row = cur.fetchone()
                if row and row['password_hash'] == password_hash:
                    user_data = {
                        "id": row['id'],
                        "username": row['username'],
                        "email": row['email']
                    }
                conn.close()
            else:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, username, email, password_hash FROM users WHERE email = %s;
                    """, (email,))
                    row = cur.fetchone()
                    if row and row['password_hash'] == password_hash:
                        user_data = {
                            "id": str(row['id']),
                            "username": row['username'],
                            "email": row['email']
                        }
        except Exception as db_err:
            return jsonify({"error": f"Database error during login: {db_err}"}), 500
            
        if user_data is None:
            return jsonify({"error": "Invalid email or password."}), 401
            
        return jsonify({
            "success": True,
            "user": user_data
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/update-settings', methods=['POST'])
def update_settings():
    try:
        data = request.json or {}
        user_id = data.get('user_id')
        username = data.get('username')
        password = data.get('password')
        
        if not user_id:
            return jsonify({"error": "User ID is required."}), 400
            
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database is not connected."}), 503
            
        try:
            if USE_SQLITE:
                cur = conn.cursor()
                if username:
                    cur.execute("UPDATE users SET username = ? WHERE id = ?;", (username, user_id))
                if password:
                    password_hash = hash_password(password)
                    cur.execute("UPDATE users SET password_hash = ? WHERE id = ?;", (password_hash, user_id))
                conn.commit()
                conn.close()
            else:
                with conn.cursor() as cur:
                    if username:
                        cur.execute("UPDATE users SET username = %s WHERE id = %s;", (username, user_id))
                    if password:
                        password_hash = hash_password(password)
                        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s;", (password_hash, user_id))
                    conn.commit()
        except Exception as db_err:
            if not USE_SQLITE:
                conn.rollback()
            return jsonify({"error": f"Database error: {db_err}"}), 500
            
        return jsonify({
            "success": True,
            "message": "Account details updated successfully."
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/farms', methods=['GET'])
def get_farms():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID is required."}), 400
            
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database is not connected."}), 503
            
        farms_list = []
        try:
            if USE_SQLITE:
                cur = conn.cursor()
                cur.execute("""
                    SELECT id, name, crop_type, area_size, created_at 
                    FROM farms 
                    WHERE user_id = ?
                    ORDER BY created_at DESC;
                """, (user_id,))
                rows = cur.fetchall()
                for r in rows:
                    farms_list.append({
                        "id": r["id"],
                        "name": r["name"],
                        "crop_type": r["crop_type"],
                        "area_size": r["area_size"],
                        "created_at": r["created_at"]
                    })
                conn.close()
            else:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, name, crop_type, area_size, created_at 
                        FROM farms 
                        WHERE user_id = %s
                        ORDER BY created_at DESC;
                    """, (user_id,))
                    rows = cur.fetchall()
                    for r in rows:
                        farms_list.append({
                            "id": str(r["id"]),
                            "name": r["name"],
                            "crop_type": r["crop_type"],
                            "area_size": r["area_size"],
                            "created_at": r["created_at"]
                        })
        except Exception as db_err:
            return jsonify({"error": f"Database error fetching farms: {db_err}"}), 500
            
        return jsonify({
            "farms": farms_list
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/farms', methods=['POST'])
def add_farm():
    try:
        data = request.json or {}
        user_id = data.get('user_id')
        name = data.get('name')
        crop_type = data.get('crop_type')
        area_size = data.get('area_size')
        
        if not user_id or not name or not crop_type or not area_size:
            return jsonify({"error": "User ID, farm name, crop type and area size are required."}), 400
            
        farm_uuid = str(uuid.uuid4())
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database is not connected."}), 503
            
        try:
            if USE_SQLITE:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO farms (id, user_id, name, crop_type, area_size)
                    VALUES (?, ?, ?, ?, ?);
                """, (farm_uuid, user_id, name, crop_type, area_size))
                conn.commit()
                conn.close()
            else:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO farms (id, user_id, name, crop_type, area_size)
                        VALUES (%s, %s, %s, %s, %s);
                    """, (farm_uuid, user_id, name, crop_type, area_size))
                    conn.commit()
        except Exception as db_err:
            if not USE_SQLITE:
                conn.rollback()
            return jsonify({"error": f"Database error creating farm: {db_err}"}), 500
            
        return jsonify({
            "success": True,
            "farm": {
                "id": farm_uuid,
                "name": name,
                "crop_type": crop_type,
                "area_size": area_size
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/farms/<farm_id>', methods=['DELETE'])
def delete_farm(farm_id):
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database is not connected."}), 503
            
        try:
            if USE_SQLITE:
                cur = conn.cursor()
                cur.execute("DELETE FROM farms WHERE id = ?;", (farm_id,))
                conn.commit()
                conn.close()
            else:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM farms WHERE id = %s;", (farm_id,))
                    conn.commit()
        except Exception as db_err:
            if not USE_SQLITE:
                conn.rollback()
            return jsonify({"error": f"Database error deleting farm: {db_err}"}), 500
            
        return jsonify({
            "success": True,
            "message": "Farm deleted successfully."
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/support', methods=['POST'])
def create_support_ticket():
    try:
        data = request.json or {}
        user_id = data.get('user_id')
        subject = data.get('subject')
        message = data.get('message')
        
        if not subject or not message:
            return jsonify({"error": "Subject and message are required."}), 400
            
        ticket_uuid = str(uuid.uuid4())
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database is not connected."}), 503
            
        try:
            if USE_SQLITE:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO support_tickets (id, user_id, subject, message)
                    VALUES (?, ?, ?, ?);
                """, (ticket_uuid, user_id, subject, message))
                conn.commit()
                conn.close()
            else:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO support_tickets (id, user_id, subject, message)
                        VALUES (%s, %s, %s, %s);
                    """, (ticket_uuid, user_id, subject, message))
                    conn.commit()
        except Exception as db_err:
            if not USE_SQLITE:
                conn.rollback()
            return jsonify({"error": f"Database error submitting ticket: {db_err}"}), 500
            
        return jsonify({
            "success": True,
            "ticket_id": ticket_uuid,
            "message": "Support ticket logged successfully."
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
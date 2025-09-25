from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta, date
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client, Client
import os
import re
from dotenv import load_dotenv

# ---------------- LOAD ENV ----------------
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.urandom(32))

# ---------------- INIT APP ----------------
app = Flask(__name__)
CORS(app)
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
jwt = JWTManager(app)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------- VALIDATION FUNCTIONS ----------------
def validate_name(name):
    return bool(re.match(r"^[A-Za-z\s\-]{2,50}$", name))

def validate_password(password):
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
    return bool(re.match(pattern, password))

def validate_dob(dob_str):
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        if age < 10 or dob > today:
            return False
        return True
    except:
        return False

def validate_gender(gender):
    return gender in ["Male", "Female", "Prefer not to say"]

# ---------------- AUTH ROUTES ----------------
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    name = data.get("name")
    gender = data.get("gender")
    dob = data.get("dob")

    if not email or not password or not confirm_password:
        return jsonify({"error": "Email, password and confirm password required"}), 400
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400
    if not validate_password(password):
        return jsonify({"error": "Password too weak"}), 400
    if not validate_name(name):
        return jsonify({"error": "Name must contain only letters, spaces or hyphens"}), 400
    if not validate_gender(gender):
        return jsonify({"error": "Invalid gender"}), 400
    if not validate_dob(dob):
        return jsonify({"error": "Invalid DOB (min age 10 years, not future)"}), 400

    existing = supabase.table("users").select("*").eq("email", email).execute().data
    if existing:
        return jsonify({"error": "Email already exists"}), 400

    hashed_password = generate_password_hash(password)
    supabase.table("users").insert({
        "email": email,
        "password_hash": hashed_password,
        "name": name,
        "gender": gender,
        "dob": dob
    }).execute()
    return jsonify({"message": "User signed up successfully"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    users = supabase.table("users").select("*").eq("email", email).execute().data
    if not users:
        return jsonify({"error": "Email not found"}), 404
    if not check_password_hash(users[0]["password_hash"], password):
        return jsonify({"error": "Incorrect password"}), 401

    access_token = create_access_token(identity=str(users[0]["id"]), expires_delta=timedelta(hours=12))
    user_data = {
        "id": users[0]["id"],
        "email": users[0]["email"],
        "name": users[0].get("name"),
        "gender": users[0].get("gender"),
        "dob": users[0].get("dob")
    }
    return jsonify({"token": access_token, "user": user_data})

@app.route("/google-login", methods=["POST"])
def google_login():
    data = request.json
    token = data.get("id_token")
    extra_data = data.get("extra_data")  # name, dob, gender from frontend after google auth

    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(token, grequests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo["email"]

        users = supabase.table("users").select("*").eq("email", email).execute().data

        if not users:
            # Require extra info for first-time Google login
            if not extra_data:
                return jsonify({"error": "Additional info required (name, dob, gender)"}), 400

            name = extra_data.get("name")
            dob = extra_data.get("dob")
            gender = extra_data.get("gender")

            if not validate_name(name):
                return jsonify({"error": "Invalid name"}), 400
            if not validate_gender(gender):
                return jsonify({"error": "Invalid gender"}), 400
            if not validate_dob(dob):
                return jsonify({"error": "Invalid DOB"}), 400

            # Insert as Google user
            supabase.table("users").insert({
                "email": email,
                "auth_provider": "google",   # <--- NEW FIELD
                "password_hash": None,       # no password for Google users
                "name": name,
                "gender": gender,
                "dob": dob
            }).execute()
            users = supabase.table("users").select("*").eq("email", email).execute().data

        else:
            # If user exists but was registered with password, block Google login
            if users[0].get("auth_provider") == "password":
                return jsonify({"error": "This email is registered with password login. Please use email+password."}), 400

        # Create session token
        access_token = create_access_token(identity=str(users[0]["id"]), expires_delta=timedelta(hours=12))
        user_data = {
            "id": users[0]["id"],
            "email": users[0]["email"],
            "name": users[0].get("name"),
            "gender": users[0].get("gender"),
            "dob": users[0].get("dob"),
            "auth_provider": users[0].get("auth_provider")
        }
        return jsonify({"token": access_token, "user": user_data})

    except Exception as e:
        print("Google login failed:", str(e))
        return jsonify({"error": "Invalid Google token"}), 400


# ---------------- TASK ROUTES ----------------
@app.route("/tasks", methods=["GET"])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()
    tasks = supabase.table("tasks").select("*").eq("user_id", user_id).execute().data
    return jsonify(tasks)

@app.route("/tasks/<int:task_id>/complete", methods=["POST"])
@jwt_required()
def complete_task(task_id):
    user_id = get_jwt_identity()

    # Update only the status field
    supabase.table("tasks").update({
        "status": "Completed"
    }).eq("id", task_id).eq("user_id", user_id).execute()

    return jsonify({"message": f"Task {task_id} marked as Completed!"})

# ---------------- SETTINGS: PROFILE ----------------
@app.route("/me", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = supabase.table("users").select("*").eq("id", user_id).single().execute().data
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "gender": user.get("gender"),
        "dob": user.get("dob"),
        "auth_provider": user.get("auth_provider", "password"),
        "preferences": user.get("preferences", {})  # JSON field in Supabase
    }
    return jsonify(profile)


@app.route("/me", methods=["PATCH"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.json
    updates = {}

    if "name" in data:
        if not validate_name(data["name"]):
            return jsonify({"error": "Invalid name"}), 400
        updates["name"] = data["name"]

    if "preferences" in data:
        updates["preferences"] = data["preferences"]

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    supabase.table("users").update(updates).eq("id", user_id).execute()
    return jsonify({"message": "Profile updated successfully"})


# ---------------- SETTINGS: SECURITY ----------------
@app.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    data = request.json
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    # Fetch user
    user = supabase.table("users").select("*").eq("id", user_id).single().execute().data
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.get("auth_provider") != "password":
        return jsonify({"error": "Password change not allowed for Google/SSO accounts"}), 400

    if not check_password_hash(user["password_hash"], current_password):
        return jsonify({"error": "Current password incorrect"}), 401
    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400
    if not validate_password(new_password):
        return jsonify({"error": "Weak password"}), 400

    hashed = generate_password_hash(new_password)
    supabase.table("users").update({"password_hash": hashed}).eq("id", user_id).execute()
    return jsonify({"message": "Password changed successfully"})


@app.route("/set-password", methods=["POST"])
@jwt_required()
def set_password():
    user_id = get_jwt_identity()
    data = request.json
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    user = supabase.table("users").select("*").eq("id", user_id).single().execute().data
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.get("auth_provider") != "google":
        return jsonify({"error": "Only Google users can set password"}), 400

    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400
    if not validate_password(new_password):
        return jsonify({"error": "Weak password"}), 400

    hashed = generate_password_hash(new_password)
    supabase.table("users").update({
        "password_hash": hashed,
        "auth_provider": "password"  # user can now login with email+password
    }).eq("id", user_id).execute()
    return jsonify({"message": "Password set successfully"})


# ---------------- USER GENDER ----------------
@app.route("/gender", methods=["GET"])
@jwt_required()
def get_gender():
    user_id = get_jwt_identity()
    user = supabase.table("users").select("gender").eq("id", user_id).single().execute().data
    if not user:
        return jsonify({"error": "User not found"}), 404

    gender = user.get("gender", "Male")  # default to Male
    return jsonify({"gender": gender})


@app.route("/tasks", methods=["POST"])
@jwt_required()
def add_task():
    user_id = get_jwt_identity()
    data = request.json
    supabase.table("tasks").insert({
        "user_id": user_id,
        "task": data.get("task"),
        "category": data.get("category", "General"),
        "priority": data.get("priority", "Medium"),
        "deadline": data.get("deadline"),
        "status": data.get("status", "Pending"),
        "recurring": data.get("recurring", False),
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    return jsonify({"message": "Task added!"}), 201

@app.route("/tasks/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_id = get_jwt_identity()
    data = request.json
    supabase.table("tasks").update({
        "task": data.get("task"),
        "category": data.get("category"),
        "priority": data.get("priority"),
        "deadline": data.get("deadline"),
        "status": data.get("status"),
        "recurring": data.get("recurring")
    }).eq("id", task_id).eq("user_id", user_id).execute()
    return jsonify({"message": "Task updated!"})

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = get_jwt_identity()
    supabase.table("tasks").delete().eq("id", task_id).eq("user_id", user_id).execute()
    return jsonify({"message": "Task deleted!"})

# ---------------- ANALYTICS ----------------
@app.route("/analytics/completion_rate", methods=["GET"])
@jwt_required()
def completion_rate():
    user_id = get_jwt_identity()
    total = supabase.table("tasks").select("*").eq("user_id", user_id).execute().data
    completed = supabase.table("tasks").select("*").eq("user_id", user_id).eq("status", "Completed").execute().data
    rate = (len(completed) / len(total) * 100) if total else 0
    return jsonify({"completion_rate": rate})

@app.route("/analytics/by_category", methods=["GET"])
@jwt_required()
def analytics_category():
    user_id = get_jwt_identity()
    tasks = supabase.table("tasks").select("category").eq("user_id", user_id).execute().data
    result = {}
    for t in tasks:
        result[t["category"]] = result.get(t["category"], 0) + 1
    return jsonify(result)

@app.route("/analytics/by_priority", methods=["GET"])
@jwt_required()
def analytics_priority():
    user_id = get_jwt_identity()
    tasks = supabase.table("tasks").select("priority").eq("user_id", user_id).execute().data
    result = {}
    for t in tasks:
        result[t["priority"]] = result.get(t["priority"], 0) + 1
    return jsonify(result)

# ---------------- WELLNESS ----------------
@app.route("/wellness/quote", methods=["GET"])
def get_quote():
    try:
        res = requests.get("https://zenquotes.io/api/today")
        if res.ok:
            data = res.json()[0]
            return jsonify({"quote": data.get("q"), "author": data.get("a")})
    except Exception as e:
        print("Quote API failed:", e)
    return jsonify({"error": "Could not fetch quote"}), 503

@app.route("/wellness/fact", methods=["GET"])
def get_fact():
    try:
        res = requests.get("https://uselessfacts.jsph.pl/random.json?language=en")
        if res.ok:
            return jsonify({"fact": res.json().get("text")})
    except Exception as e:
        print("Fact API failed:", e)
    return jsonify({"error": "Could not fetch fact"}), 503

# ---------------- RUN APP ----------------
if __name__ == "__main__":
    app.run(debug=True)

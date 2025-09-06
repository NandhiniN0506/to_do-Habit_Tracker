from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as grequests

from models import db, User, Task

app = Flask(__name__)
CORS(app)

# ---------------- Database Config ----------------
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = "super-secret-key"  # Change in production
db.init_app(app)
jwt = JWTManager(app)


# ---------------- AUTH ROUTES ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=12))
    return jsonify({"token": access_token, "user": user.to_dict()})


@app.route("/google-login", methods=["POST"])
def google_login():
    data = request.json
    token = data.get("id_token")

    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(
            token,
            grequests.Request(),
            "<YOUR_GOOGLE_CLIENT_ID>"  # <-- replace with your Google client ID
        )

        email = idinfo["email"]

        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email, password_hash="")
            db.session.add(user)
            db.session.commit()

        # Issue JWT
        access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=12))
        return jsonify({"token": access_token, "user": user.to_dict()})

    except Exception as e:
        print("Google login failed:", e)
        return jsonify({"error": "Invalid Google token"}), 400


# ---------------- TASK ROUTES ----------------
@app.route("/tasks", methods=["GET"])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([t.to_dict() for t in tasks])


@app.route("/tasks", methods=["POST"])
@jwt_required()
def add_task():
    user_id = get_jwt_identity()
    data = request.json

    new_task = Task(
        task=data["task"],
        category=data.get("category", "General"),
        priority=data.get("priority", "Medium"),
        deadline=data.get("deadline"),
        status=data.get("status", "Pending"),
        recurring=data.get("recurring", False),
        user_id=user_id
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({"message": "Task added!"}), 201


@app.route("/tasks/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first_or_404()

    data = request.json
    task.task = data.get("task", task.task)
    task.category = data.get("category", task.category)
    task.priority = data.get("priority", task.priority)
    task.deadline = data.get("deadline", task.deadline)
    task.status = data.get("status", task.status)
    task.recurring = data.get("recurring", task.recurring)

    db.session.commit()
    return jsonify({"message": "Task updated!"})


@app.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first_or_404()

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted!"})


# ---------------- ANALYTICS ----------------
@app.route("/analytics/completion_rate", methods=["GET"])
@jwt_required()
def completion_rate():
    user_id = get_jwt_identity()
    total = Task.query.filter_by(user_id=user_id).count()
    completed = Task.query.filter_by(user_id=user_id, status="Completed").count()
    rate = (completed / total * 100) if total > 0 else 0
    return jsonify({"completion_rate": rate})


@app.route("/analytics/by_category", methods=["GET"])
@jwt_required()
def analytics_category():
    user_id = get_jwt_identity()
    categories = db.session.query(Task.category, db.func.count(Task.id)).filter_by(user_id=user_id).group_by(Task.category).all()
    return jsonify({cat: count for cat, count in categories})


@app.route("/analytics/by_priority", methods=["GET"])
@jwt_required()
def analytics_priority():
    user_id = get_jwt_identity()
    priorities = db.session.query(Task.priority, db.func.count(Task.id)).filter_by(user_id=user_id).group_by(Task.priority).all()
    return jsonify({prio: count for prio, count in priorities})


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
    with app.app_context():
        db.create_all()
    app.run(debug=True)

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# ---------------- User Model ----------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)  # store hashed password only
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship: One user -> Many tasks
    tasks = db.relationship('Task', backref='user', lazy=True, cascade="all, delete-orphan")

    # Password methods
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "created_at": self.created_at.strftime("%Y-%m-%d")
        }


# ---------------- Task Model ----------------
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), default="General")
    priority = db.Column(db.String(20), default="Medium")  # Low, Medium, High
    deadline = db.Column(db.String(50), nullable=True)  # store as string (YYYY-MM-DD)
    status = db.Column(db.String(20), default="Pending")  # Pending / Completed
    recurring = db.Column(db.Boolean, default=False)
    consistency_score = db.Column(db.Integer, default=0)  # 0-100 for habit tracking
    last_completed = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Foreign key -> links to User
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "task": self.task,
            "category": self.category,
            "priority": self.priority,
            "deadline": self.deadline,
            "status": self.status,
            "recurring": self.recurring,
            "consistency_score": self.consistency_score,
            "last_completed": self.last_completed.strftime("%Y-%m-%d") if self.last_completed else None,
            "created_at": self.created_at.strftime("%Y-%m-%d"),
            "user_id": self.user_id
        }

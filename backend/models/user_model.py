from werkzeug.security import generate_password_hash, check_password_hash
import json
import os

# Use local file storage instead of MongoDB
USERS_FILE = os.path.join(os.path.dirname(__file__), 'users.json')

def _load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def _save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

# Function to create a new user
def create_user(username, password):
    users = _load_users()
    if username in users:
        return None  # User already exists
    hashed_password = generate_password_hash(password)
    users[username] = {"username": username, "password": hashed_password}
    _save_users(users)
    return users[username]

# Function to authenticate a user
def authenticate_user(username, password):
    users = _load_users()
    if username not in users:
        return None
    user = users[username]
    if not check_password_hash(user["password"], password):
        return None
    return user

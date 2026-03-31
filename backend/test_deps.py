
try:
    import flask
    print("flask imported")
except ImportError as e:
    print(f"flask missing: {e}")

try:
    import google.generativeai as genai
    print("google.generativeai imported")
except ImportError as e:
    print(f"google.generativeai missing: {e}")

try:
    import dotenv
    print("dotenv imported")
except ImportError as e:
    print(f"dotenv missing: {e}")
    
try:
    import requests
    print("requests imported")
except ImportError as e:
    print(f"requests missing: {e}")

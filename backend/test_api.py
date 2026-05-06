import requests
import json

def test_login():
    url = "http://127.0.0.1:8000/auth/login"
    payload = {
        "email": "test@test.com",
        "password": "wrongpassword"
    }
    print(f"Probando conexión local a {url}...")
    try:
        response = requests.post(url, json=payload, timeout=5)
        print(f"Respuesta recibida: {response.status_code}")
        print(f"Contenido: {response.text}")
    except Exception as e:
        print(f"ERROR DE CONEXIÓN: {e}")

if __name__ == "__main__":
    test_login()

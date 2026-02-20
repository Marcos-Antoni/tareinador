"""
Tareinador V3 — Flask API Backend
API REST independiente del frontend.
"""
from flask import Flask, send_from_directory
from flask_cors import CORS
from src.config import HOST, PORT, UPLOAD_DIR


def create_app():
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max upload

    # CORS: en producción Nginx hace proxy, pero por si acaso
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    # En producción, agregar el dominio del VPS
    import os
    prod_origin = os.environ.get("CORS_ORIGIN")
    if prod_origin:
        allowed_origins.append(prod_origin)
    CORS(app, origins=allowed_origins)

    # Registrar rutas API
    from src.routes import api
    app.register_blueprint(api)

    # Servir imágenes subidas
    @app.route("/uploads/<filename>")
    def serve_upload(filename):
        return send_from_directory(UPLOAD_DIR, filename)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host=HOST, port=PORT, debug=False)

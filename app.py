"""
Tareinador V2 — Generador de Tareas Académicas con IA
- Flask app principal
- Registra rutas y sirve archivos estáticos
"""
from flask import Flask, send_from_directory
from src.config import HOST, PORT, UPLOAD_DIR


def create_app():
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max upload

    # Registrar rutas
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

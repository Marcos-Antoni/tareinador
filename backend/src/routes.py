"""
Rutas de la API REST.
- Endpoints para generación, edición, preview y descarga
- Manejo de subida de imágenes
"""
import os
import uuid
from flask import Blueprint, request, jsonify, send_file
from .document_store import (
    create_document, save_document, get_document,
    update_page, add_image_to_page, remove_image_from_page,
)
from .gemini_service import generate_document, edit_section
from .pdf_service import build_document_html, generate_pdf
from .config import UPLOAD_DIR

api = Blueprint("api", __name__)


# ─── Generar documento con IA ───
@api.route("/api/generate", methods=["POST"])
def api_generate():
    """
    Recibe la configuración del documento y genera el contenido con Gemini.
    Body JSON: { title, author, carnet, includeCaratula, includeIndice,
                 sections: [{ name, description, pages }] }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Se requieren datos JSON"}), 400

    title = data.get("title", "Sin título")
    author = data.get("author", "Estudiante")
    carnet = data.get("carnet", "")
    include_caratula = data.get("includeCaratula", True)
    include_indice = data.get("includeIndice", True)
    sections = data.get("sections", [])

    # Crear documento en el store
    section_ids = ["caratula"] if include_caratula else []
    if include_indice:
        section_ids.append("indice")
    doc_id, doc = create_document(title, author, carnet, section_ids)
    doc["includeCaratula"] = include_caratula
    doc["includeIndice"] = include_indice

    # Datos universitarios para la carátula
    doc["universidad"] = data.get("universidad", "")
    doc["centro"] = data.get("centro", "")
    doc["carrera"] = data.get("carrera", "")
    doc["docente"] = data.get("docente", "")
    doc["materia"] = data.get("materia", "")
    doc["semestre"] = data.get("semestre", "")
    doc["sede"] = data.get("sede", "")

    # Generar contenido con Gemini
    pages = generate_document(title, sections, author, carnet)

    # Agregar lista de imágenes vacía a cada página
    for page in pages:
        if "images" not in page:
            page["images"] = []

    doc["pages"] = pages
    save_document(doc_id, doc)

    return jsonify({
        "doc_id": doc_id,
        "title": title,
        "pages": pages,
        "total_pages": len(pages),
    })


# ─── Obtener documento ───
@api.route("/api/document/<doc_id>")
def api_get_document(doc_id):
    """Retorna el documento completo."""
    doc = get_document(doc_id)
    if not doc:
        return jsonify({"error": "Documento no encontrado"}), 404
    return jsonify(doc)


# ─── Editar una página con IA ───
@api.route("/api/edit-page", methods=["POST"])
def api_edit_page():
    """
    Edita una página usando instrucciones en lenguaje natural.
    Body JSON: { doc_id, page_index, instructions }
    """
    data = request.get_json()
    doc_id = data.get("doc_id")
    page_index = data.get("page_index", 0)
    instructions = data.get("instructions", "")

    doc = get_document(doc_id)
    if not doc:
        return jsonify({"error": "Documento no encontrado"}), 404
    if page_index >= len(doc["pages"]):
        return jsonify({"error": "Página no encontrada"}), 404

    current_content = doc["pages"][page_index]["content"]
    new_content = edit_section(current_content, instructions)

    update_page(doc_id, page_index, content=new_content)

    return jsonify({
        "page_index": page_index,
        "content": new_content,
    })


# ─── Actualizar página manualmente ───
@api.route("/api/update-page", methods=["POST"])
def api_update_page():
    """
    Actualiza el contenido de una página directamente.
    Body JSON: { doc_id, page_index, content }
    """
    data = request.get_json()
    doc_id = data.get("doc_id")
    page_index = data.get("page_index", 0)
    content = data.get("content", "")

    result = update_page(doc_id, page_index, content=content)
    if not result:
        return jsonify({"error": "Página no encontrada"}), 404

    return jsonify({"page_index": page_index, "content": content})


# ─── Preview HTML del documento ───
@api.route("/api/preview/<doc_id>")
def api_preview(doc_id):
    """Retorna el HTML completo del documento para preview."""
    doc = get_document(doc_id)
    if not doc:
        return jsonify({"error": "Documento no encontrado"}), 404

    html = build_document_html(doc)
    return html, 200, {"Content-Type": "text/html; charset=utf-8"}


# ─── Descargar PDF ───
@api.route("/api/download/<doc_id>")
def api_download(doc_id):
    """Genera y descarga el PDF del documento."""
    doc = get_document(doc_id)
    if not doc:
        return jsonify({"error": "Documento no encontrado"}), 404

    pdf_path = generate_pdf(doc)
    return send_file(
        pdf_path,
        as_attachment=True,
        download_name=f"{doc['title']}.pdf",
        mimetype="application/pdf",
    )


# ─── Subir imagen propia ───
@api.route("/api/upload-image", methods=["POST"])
def api_upload_image():
    """
    Sube una imagen del usuario y la asocia a una página.
    Form data: doc_id, page_index, image (file), caption
    """
    doc_id = request.form.get("doc_id")
    page_index = int(request.form.get("page_index", 0))
    caption = request.form.get("caption", "")

    if "image" not in request.files:
        return jsonify({"error": "No se envió ninguna imagen"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Nombre de archivo vacío"}), 400

    # Guardar el archivo
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    file.save(filepath)

    # URL relativa para servir el archivo
    image_url = f"/uploads/{filename}"
    result = add_image_to_page(doc_id, page_index, image_url, caption)

    if not result:
        return jsonify({"error": "Página no encontrada"}), 404

    return jsonify({"image_url": image_url, "caption": caption})


# ─── Eliminar imagen de una página ───
@api.route("/api/remove-image", methods=["POST"])
def api_remove_image():
    """
    Elimina una imagen de una página.
    Body JSON: { doc_id, page_index, image_index }
    """
    data = request.get_json()
    doc_id = data.get("doc_id")
    page_index = data.get("page_index", 0)
    image_index = data.get("image_index", 0)

    result = remove_image_from_page(doc_id, page_index, image_index)
    if not result:
        return jsonify({"error": "Imagen no encontrada"}), 404

    return jsonify({"success": True})

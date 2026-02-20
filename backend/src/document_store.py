"""
Almacén de documentos en memoria.
- Guarda el estado del documento generado por sesión
- Estructura: {session_id: DocumentData}
"""
import uuid
from datetime import datetime


def create_document(title, author, carnet, sections):
    """
    Crea un nuevo documento vacío con metadata.
    - title: título del trabajo
    - author: nombre completo
    - carnet: número de carnet
    - sections: lista de secciones seleccionadas
    Retorna: (doc_id, document_dict)
    """
    doc_id = str(uuid.uuid4())[:8]
    doc = {
        "id": doc_id,
        "title": title,
        "author": author,
        "carnet": carnet,
        "date": datetime.now().strftime("%d de %B, %Y"),
        "sections": sections,
        "pages": [],
        "created_at": datetime.now().isoformat(),
    }
    return doc_id, doc


# Almacén global en memoria
_store: dict = {}


def save_document(doc_id, doc):
    """Guarda un documento en el store."""
    _store[doc_id] = doc


def get_document(doc_id):
    """Obtiene un documento por su ID."""
    return _store.get(doc_id)


def update_page(doc_id, page_index, content=None, images=None):
    """
    Actualiza una página específica del documento.
    - page_index: índice de la página (0-based)
    - content: nuevo contenido HTML (opcional)
    - images: nueva lista de imágenes (opcional)
    """
    doc = _store.get(doc_id)
    if not doc or page_index >= len(doc["pages"]):
        return None

    if content is not None:
        doc["pages"][page_index]["content"] = content
    if images is not None:
        doc["pages"][page_index]["images"] = images

    return doc["pages"][page_index]


def add_image_to_page(doc_id, page_index, image_url, caption=""):
    """Agrega una imagen a una página específica."""
    doc = _store.get(doc_id)
    if not doc or page_index >= len(doc["pages"]):
        return None

    if "images" not in doc["pages"][page_index]:
        doc["pages"][page_index]["images"] = []

    doc["pages"][page_index]["images"].append({
        "url": image_url,
        "caption": caption,
    })
    return doc["pages"][page_index]


def remove_image_from_page(doc_id, page_index, image_index):
    """Elimina una imagen de una página específica."""
    doc = _store.get(doc_id)
    if not doc or page_index >= len(doc["pages"]):
        return None

    images = doc["pages"][page_index].get("images", [])
    if image_index < len(images):
        images.pop(image_index)

    return doc["pages"][page_index]

const API_BASE = "";

export async function generateDocument(data) {
    const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al generar");
    }
    return res.json();
}

export async function getDocument(docId) {
    const res = await fetch(`${API_BASE}/api/document/${docId}`);
    if (!res.ok) throw new Error("Documento no encontrado");
    return res.json();
}

export async function editPageWithAI(docId, pageIndex, instructions) {
    const res = await fetch(`${API_BASE}/api/edit-page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: docId, page_index: pageIndex, instructions }),
    });
    if (!res.ok) throw new Error("Error al editar");
    return res.json();
}

export async function updatePage(docId, pageIndex, content) {
    const res = await fetch(`${API_BASE}/api/update-page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: docId, page_index: pageIndex, content }),
    });
    if (!res.ok) throw new Error("Error al guardar");
    return res.json();
}

export async function getPreviewHTML(docId) {
    const res = await fetch(`${API_BASE}/api/preview/${docId}`);
    if (!res.ok) throw new Error("Error al cargar preview");
    return res.text();
}

export async function downloadPDF(docId, title) {
    const res = await fetch(`${API_BASE}/api/download/${docId}`);
    if (!res.ok) throw new Error("Error al generar PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "tarea"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}

export async function uploadImage(docId, pageIndex, file, caption) {
    const fd = new FormData();
    fd.append("doc_id", docId);
    fd.append("page_index", pageIndex);
    fd.append("image", file);
    fd.append("caption", caption || "");
    const res = await fetch(`${API_BASE}/api/upload-image`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Error al subir imagen");
    return res.json();
}

export async function removeImage(docId, pageIndex, imageIndex) {
    const res = await fetch(`${API_BASE}/api/remove-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: docId, page_index: pageIndex, image_index: imageIndex }),
    });
    if (!res.ok) throw new Error("Error al eliminar imagen");
    return res.json();
}

export { API_BASE };

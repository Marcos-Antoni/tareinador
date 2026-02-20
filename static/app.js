/* ============================================================
   TAREINADOR V2 — App JavaScript (SPA)
   Maneja: navegación, llamadas API, estado, preview, edición
   ============================================================ */

// ─── Estado Global ───
const state = {
    docId: null,
    document: null,
    currentPage: 0,
    editMode: false,
    loading: false,
};

// ─── DOM Cache ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ─── Inicialización ───
document.addEventListener("DOMContentLoaded", () => {
    showView("setup");
    setupEventListeners();
});

function setupEventListeners() {
    // Setup form submit
    $("#setup-form").addEventListener("submit", handleGenerate);

    // Page navigation
    $("#btn-prev-page").addEventListener("click", () => navigatePage(-1));
    $("#btn-next-page").addEventListener("click", () => navigatePage(1));

    // AI edit
    $("#btn-ai-edit").addEventListener("click", handleAIEdit);

    // Manual edit toggle
    $("#btn-toggle-edit").addEventListener("click", toggleManualEdit);

    // Save manual edit
    $("#btn-save-edit").addEventListener("click", saveManualEdit);

    // Download PDF
    $("#btn-download").addEventListener("click", handleDownload);

    // Full preview
    $("#btn-full-preview").addEventListener("click", handleFullPreview);

    // Back to editor from full preview
    $("#btn-back-editor").addEventListener("click", () => showView("editor"));

    // New document
    $$("#btn-new-doc").forEach(btn => btn.addEventListener("click", () => {
        state.docId = null;
        state.document = null;
        state.currentPage = 0;
        showView("setup");
    }));

    // Image upload
    $("#upload-area").addEventListener("click", () => $("#image-upload-input").click());
    $("#image-upload-input").addEventListener("change", handleImageUpload);

    // Allow drag and drop
    const uploadArea = $("#upload-area");
    uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = "var(--accent)";
    });
    uploadArea.addEventListener("dragleave", () => {
        uploadArea.style.borderColor = "";
    });
    uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = "";
        if (e.dataTransfer.files.length > 0) {
            uploadImageFile(e.dataTransfer.files[0]);
        }
    });
}

// ─── View Navigation ───
function showView(viewName) {
    $$(".view").forEach((v) => v.classList.remove("active"));
    $(`#view-${viewName}`).classList.add("active");
}

// ─── Loading Overlay ───
function setLoading(isLoading, message = "Generando con IA...") {
    state.loading = isLoading;
    const overlay = $("#loading-overlay");
    const msgEl = overlay.querySelector("p");
    msgEl.textContent = message;
    if (isLoading) {
        overlay.classList.add("active");
    } else {
        overlay.classList.remove("active");
    }
}

// ─── Toast Notifications ───
function toast(message, type = "info") {
    const el = $("#toast");
    el.textContent = message;
    el.className = `toast ${type} show`;
    setTimeout(() => el.classList.remove("show"), 3500);
}

// ─── Generate Document ───
async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true, "🤖 La IA está investigando y generando tu documento...");

    const title = $("#input-title").value.trim();
    const topic = $("#input-topic").value.trim() || title;
    const author = $("#input-author").value.trim();
    const carnet = $("#input-carnet").value.trim();

    // Collect selected sections
    const sections = [];
    $$(".section-checkbox:checked").forEach((cb) => sections.push(cb.value));

    // Ensure caratula is always included
    if (!sections.includes("caratula")) sections.unshift("caratula");

    try {
        const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, topic, author, carnet, sections }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error al generar");
        }

        const data = await res.json();
        state.docId = data.doc_id;
        state.currentPage = 0;

        // Fetch full document
        await loadDocument();

        setLoading(false);
        showView("editor");
        renderCurrentPage();
        toast("✅ Documento generado exitosamente", "success");
    } catch (err) {
        setLoading(false);
        toast(`❌ ${err.message}`, "error");
    }
}

// ─── Load Document ───
async function loadDocument() {
    const res = await fetch(`/api/document/${state.docId}`);
    state.document = await res.json();
}

// ─── Page Navigation ───
function navigatePage(delta) {
    const pages = state.document.pages;
    const newPage = state.currentPage + delta;
    if (newPage >= 0 && newPage < pages.length) {
        // If in edit mode, save current edits first
        if (state.editMode) {
            toggleManualEdit();
        }
        state.currentPage = newPage;
        renderCurrentPage();
    }
}

function renderCurrentPage() {
    const doc = state.document;
    const pages = doc.pages;
    const page = pages[state.currentPage];

    // Update page indicator
    $("#page-indicator").textContent = `Página ${state.currentPage + 1} de ${pages.length}`;
    $("#page-title").textContent = page.title || "Sin título";

    // Navigation buttons
    $("#btn-prev-page").disabled = state.currentPage === 0;
    $("#btn-next-page").disabled = state.currentPage === pages.length - 1;

    // Render content preview
    const previewEl = $("#preview-content");
    let html = `<h2>${page.title || ""}</h2>${page.content || ""}`;

    // Render images
    if (page.images && page.images.length > 0) {
        for (const img of page.images) {
            html += `<div style="text-align:center;margin:15px 0;">
                <img src="${img.url}" alt="${img.caption || ""}" style="max-width:80%;border:1px solid #ddd;border-radius:4px;">
                ${img.caption ? `<p style="font-size:0.9em;color:#666;font-style:italic;">${img.caption}</p>` : ""}
            </div>`;
        }
    }

    previewEl.innerHTML = html;
    previewEl.contentEditable = "false";
    state.editMode = false;
    $("#btn-toggle-edit").textContent = "✏️ Editar manualmente";
    $("#btn-save-edit").style.display = "none";

    // Render sidebar images
    renderImageGallery();
}

// ─── Image Gallery ───
function renderImageGallery() {
    const page = state.document.pages[state.currentPage];
    const gallery = $("#image-gallery");
    gallery.innerHTML = "";

    if (page.images && page.images.length > 0) {
        for (let i = 0; i < page.images.length; i++) {
            const img = page.images[i];
            const item = document.createElement("div");
            item.className = "image-item";
            item.innerHTML = `
                <img src="${img.url}" alt="${img.caption || ""}">
                <div class="image-actions">
                    <button class="btn btn-danger btn-sm" onclick="removeImage(${i})">✕</button>
                </div>
                ${img.caption ? `<div class="image-caption">${img.caption}</div>` : ""}
            `;
            gallery.appendChild(item);
        }
    }
}

// ─── AI Edit ───
async function handleAIEdit() {
    const instructions = $("#ai-instructions").value.trim();
    if (!instructions) {
        toast("Escribe instrucciones para la IA", "error");
        return;
    }

    setLoading(true, "🤖 La IA está editando la página...");

    try {
        const res = await fetch("/api/edit-page", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                doc_id: state.docId,
                page_index: state.currentPage,
                instructions,
            }),
        });

        if (!res.ok) throw new Error("Error al editar");

        const data = await res.json();
        state.document.pages[state.currentPage].content = data.content;

        setLoading(false);
        renderCurrentPage();
        $("#ai-instructions").value = "";
        toast("✅ Página editada con IA", "success");
    } catch (err) {
        setLoading(false);
        toast(`❌ ${err.message}`, "error");
    }
}

// ─── Manual Edit ───
function toggleManualEdit() {
    state.editMode = !state.editMode;
    const previewEl = $("#preview-content");

    if (state.editMode) {
        previewEl.contentEditable = "true";
        previewEl.focus();
        $("#btn-toggle-edit").textContent = "🔒 Salir de edición";
        $("#btn-save-edit").style.display = "inline-flex";
        toast("Modo de edición activado — edita directamente el texto", "info");
    } else {
        previewEl.contentEditable = "false";
        $("#btn-toggle-edit").textContent = "✏️ Editar manualmente";
        $("#btn-save-edit").style.display = "none";
    }
}

async function saveManualEdit() {
    const previewEl = $("#preview-content");
    // Extract content without the h2 title
    const clone = previewEl.cloneNode(true);
    const h2 = clone.querySelector("h2");
    const newTitle = h2 ? h2.textContent : state.document.pages[state.currentPage].title;
    if (h2) h2.remove();

    // Remove image divs from content (they're managed separately)
    clone.querySelectorAll("[style*='text-align:center']").forEach(el => el.remove());

    const newContent = clone.innerHTML.trim();

    try {
        const res = await fetch("/api/update-page", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                doc_id: state.docId,
                page_index: state.currentPage,
                content: newContent,
            }),
        });

        if (!res.ok) throw new Error("Error al guardar");

        state.document.pages[state.currentPage].content = newContent;
        state.document.pages[state.currentPage].title = newTitle;
        toggleManualEdit();
        renderCurrentPage();
        toast("✅ Cambios guardados", "success");
    } catch (err) {
        toast(`❌ ${err.message}`, "error");
    }
}

// ─── Image Upload ───
function handleImageUpload(e) {
    if (e.target.files.length > 0) {
        uploadImageFile(e.target.files[0]);
    }
}

async function uploadImageFile(file) {
    const caption = prompt("Escribe un pie de imagen (opcional):", "") || "";

    const formData = new FormData();
    formData.append("doc_id", state.docId);
    formData.append("page_index", state.currentPage);
    formData.append("image", file);
    formData.append("caption", caption);

    try {
        const res = await fetch("/api/upload-image", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) throw new Error("Error al subir imagen");

        const data = await res.json();

        // Update local state
        if (!state.document.pages[state.currentPage].images) {
            state.document.pages[state.currentPage].images = [];
        }
        state.document.pages[state.currentPage].images.push({
            url: data.image_url,
            caption: data.caption,
        });

        renderCurrentPage();
        toast("📸 Imagen agregada", "success");
    } catch (err) {
        toast(`❌ ${err.message}`, "error");
    }
}

// ─── Remove Image ───
async function removeImage(imageIndex) {
    try {
        const res = await fetch("/api/remove-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                doc_id: state.docId,
                page_index: state.currentPage,
                image_index: imageIndex,
            }),
        });

        if (!res.ok) throw new Error("Error al eliminar imagen");

        state.document.pages[state.currentPage].images.splice(imageIndex, 1);
        renderCurrentPage();
        toast("🗑️ Imagen eliminada", "success");
    } catch (err) {
        toast(`❌ ${err.message}`, "error");
    }
}

// ─── Download PDF ───
async function handleDownload() {
    setLoading(true, "📄 Generando PDF...");

    try {
        const res = await fetch(`/api/download/${state.docId}`);
        if (!res.ok) throw new Error("Error al generar PDF");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${state.document.title || "tarea"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        setLoading(false);
        toast("📄 PDF descargado", "success");
    } catch (err) {
        setLoading(false);
        toast(`❌ ${err.message}`, "error");
    }
}

// ─── Full Preview ───
async function handleFullPreview() {
    setLoading(true, "Cargando preview completo...");

    try {
        const res = await fetch(`/api/preview/${state.docId}`);
        if (!res.ok) throw new Error("Error al cargar preview");

        const html = await res.text();
        const iframe = $("#full-preview-iframe");
        iframe.srcdoc = html;

        setLoading(false);
        showView("preview");
    } catch (err) {
        setLoading(false);
        toast(`❌ ${err.message}`, "error");
    }
}

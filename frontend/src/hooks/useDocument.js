import { useState, useCallback } from "react";
import * as api from "../services/api";

export function useDocument() {
    const [docId, setDocId] = useState(null);
    const [document, setDocument] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    const [error, setError] = useState(null);

    const generate = useCallback(async (formData) => {
        setLoading(true);
        setLoadingMsg("🤖 La IA está investigando y generando tu documento...");
        setError(null);
        try {
            const result = await api.generateDocument(formData);
            setDocId(result.doc_id);
            const doc = await api.getDocument(result.doc_id);
            setDocument(doc);
            setCurrentPage(0);
            return true;
        } catch (e) {
            setError(e.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const editWithAI = useCallback(async (instructions) => {
        if (!docId) return false;
        setLoading(true);
        setLoadingMsg("🤖 Editando con IA...");
        try {
            const result = await api.editPageWithAI(docId, currentPage, instructions);
            setDocument((prev) => {
                const updated = { ...prev, pages: [...prev.pages] };
                updated.pages[currentPage] = { ...updated.pages[currentPage], content: result.content };
                return updated;
            });
            return true;
        } catch (e) {
            setError(e.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [docId, currentPage]);

    const savePageContent = useCallback(async (content) => {
        if (!docId) return;
        try {
            await api.updatePage(docId, currentPage, content);
            setDocument((prev) => {
                const updated = { ...prev, pages: [...prev.pages] };
                updated.pages[currentPage] = { ...updated.pages[currentPage], content };
                return updated;
            });
        } catch (e) {
            setError(e.message);
        }
    }, [docId, currentPage]);

    const addImage = useCallback(async (file, caption) => {
        if (!docId) return;
        try {
            const result = await api.uploadImage(docId, currentPage, file, caption);
            setDocument((prev) => {
                const updated = { ...prev, pages: [...prev.pages] };
                const page = { ...updated.pages[currentPage] };
                page.images = [...(page.images || []), { url: result.image_url, caption: result.caption }];
                updated.pages[currentPage] = page;
                return updated;
            });
        } catch (e) {
            setError(e.message);
        }
    }, [docId, currentPage]);

    const deleteImage = useCallback(async (imageIndex) => {
        if (!docId) return;
        try {
            await api.removeImage(docId, currentPage, imageIndex);
            setDocument((prev) => {
                const updated = { ...prev, pages: [...prev.pages] };
                const page = { ...updated.pages[currentPage] };
                page.images = page.images.filter((_, i) => i !== imageIndex);
                updated.pages[currentPage] = page;
                return updated;
            });
        } catch (e) {
            setError(e.message);
        }
    }, [docId, currentPage]);

    const download = useCallback(async () => {
        if (!docId) return;
        setLoading(true);
        setLoadingMsg("📄 Generando PDF...");
        try {
            await api.downloadPDF(docId, document?.title);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [docId, document]);

    const getPreview = useCallback(async () => {
        if (!docId) return "";
        return api.getPreviewHTML(docId);
    }, [docId]);

    const page = document?.pages?.[currentPage] || null;
    const totalPages = document?.pages?.length || 0;

    return {
        docId, document, page, currentPage, totalPages,
        loading, loadingMsg, error,
        setCurrentPage, setError,
        generate, editWithAI, savePageContent,
        addImage, deleteImage, download, getPreview,
    };
}

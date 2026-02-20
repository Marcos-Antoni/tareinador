import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Eye, FilePlus } from "lucide-react";
import PagePreview from "./PagePreview";
import Sidebar from "./Sidebar";

export default function PageEditor({
    document: doc,
    page,
    currentPage,
    totalPages,
    onNavigate,
    onAIEdit,
    onSaveContent,
    onUploadImage,
    onDeleteImage,
    onDownload,
    onPreview,
    onNewDoc,
    disabled,
}) {
    const [editMode, setEditMode] = useState(false);
    const [pendingContent, setPendingContent] = useState(null);

    const toggleEdit = () => {
        if (editMode && pendingContent !== null) {
            setPendingContent(null);
        }
        setEditMode(!editMode);
    };

    const handleSave = () => {
        if (pendingContent !== null) {
            onSaveContent(pendingContent);
            setPendingContent(null);
        }
        setEditMode(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Page Nav */}
            <div className="glass-card page-nav-card">
                <div className="page-nav">
                    <button className="btn btn-ghost btn-sm" onClick={() => onNavigate(-1)} disabled={currentPage === 0}>
                        <ChevronLeft size={20} />
                    </button>
                    <div className="page-nav-info">
                        <span className="page-indicator">Página {currentPage + 1} de {totalPages}</span>
                        <span className="page-title">{page?.title || "—"}</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => onNavigate(1)} disabled={currentPage >= totalPages - 1}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Editor Layout */}
            <div className="editor-layout">
                <AnimatePresence mode="wait">
                    <PagePreview
                        key={currentPage}
                        page={page}
                        editMode={editMode}
                        onContentChange={setPendingContent}
                    />
                </AnimatePresence>

                <Sidebar
                    page={page}
                    editMode={editMode}
                    onToggleEdit={toggleEdit}
                    onSaveEdit={handleSave}
                    onAIEdit={onAIEdit}
                    onUploadImage={onUploadImage}
                    onDeleteImage={onDeleteImage}
                    disabled={disabled}
                />
            </div>

            {/* Action Bar */}
            <div className="action-bar">
                <div className="action-group">
                    <button className="btn btn-ghost btn-sm" onClick={onNewDoc}>
                        <FilePlus size={16} /> Nuevo
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={onPreview}>
                        <Eye size={16} /> Vista completa
                    </button>
                </div>
                <button className="btn btn-success" onClick={onDownload} disabled={disabled}>
                    <Download size={18} /> Descargar PDF
                </button>
            </div>
        </motion.div>
    );
}

import { useState } from "react";
import { BotMessageSquare, PenLine, Save } from "lucide-react";
import ImageManager from "./ImageManager";

export default function Sidebar({
    page,
    editMode,
    onToggleEdit,
    onSaveEdit,
    onAIEdit,
    onUploadImage,
    onDeleteImage,
    disabled,
}) {
    const [instructions, setInstructions] = useState("");

    const handleAIEdit = () => {
        if (!instructions.trim()) return;
        onAIEdit(instructions);
        setInstructions("");
    };

    return (
        <div className="sidebar-panel">
            {/* AI Edit */}
            <div className="sidebar-section">
                <h3><BotMessageSquare size={14} /> Editar con IA</h3>
                <textarea
                    className="ai-textarea"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Ej: Haz la introducción más formal, agrega más datos..."
                    rows={3}
                />
                <button
                    className="btn btn-primary btn-sm btn-block"
                    onClick={handleAIEdit}
                    disabled={disabled || !instructions.trim()}
                    style={{ marginTop: "0.75rem" }}
                >
                    <BotMessageSquare size={16} /> Aplicar con IA
                </button>
            </div>

            {/* Manual Edit */}
            <div className="sidebar-section">
                <h3><PenLine size={14} /> Edición manual</h3>
                <button
                    className={`btn ${editMode ? "btn-accent" : "btn-secondary"} btn-sm btn-block`}
                    onClick={onToggleEdit}
                >
                    <PenLine size={16} /> {editMode ? "Salir de edición" : "Editar manualmente"}
                </button>
                {editMode && (
                    <button
                        className="btn btn-success btn-sm btn-block"
                        onClick={onSaveEdit}
                        style={{ marginTop: "0.5rem" }}
                    >
                        <Save size={16} /> Guardar cambios
                    </button>
                )}
            </div>

            {/* Images */}
            <ImageManager page={page} onUpload={onUploadImage} onDelete={onDeleteImage} />
        </div>
    );
}

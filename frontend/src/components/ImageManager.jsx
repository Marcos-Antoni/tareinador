import { useRef, useState } from "react";
import { Upload, X, ImagePlus } from "lucide-react";

export default function ImageManager({ page, onUpload, onDelete }) {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const images = page?.images || [];

    const handleFile = (file) => {
        if (!file) return;
        const caption = prompt("Pie de imagen (opcional):", "") || "";
        onUpload(file, caption);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    };

    return (
        <div className="sidebar-section">
            <h3><ImagePlus size={14} /> Imágenes</h3>

            {images.length > 0 && (
                <div className="image-gallery">
                    {images.map((img, i) => (
                        <div className="image-item" key={i}>
                            <img src={img.url} alt={img.caption || ""} />
                            <button className="image-delete-btn" onClick={() => onDelete(i)}>
                                <X size={14} />
                            </button>
                            {img.caption && <div className="image-caption">{img.caption}</div>}
                        </div>
                    ))}
                </div>
            )}

            <div
                className={`upload-area ${dragOver ? "drag-over" : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <Upload size={24} />
                <p>Arrastra o haz clic para subir</p>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
            />
        </div>
    );
}

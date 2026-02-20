import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function FullPreview({ docId, getPreview, onClose }) {
    const [html, setHtml] = useState(null);

    useState(() => {
        getPreview().then(setHtml);
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                className="fullpreview-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="fullpreview-header">
                    <h2>Vista Completa del Documento</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>
                        <X size={20} /> Cerrar
                    </button>
                </div>
                <div className="fullpreview-body">
                    {html ? (
                        <iframe
                            srcDoc={html}
                            title="Preview"
                            className="fullpreview-iframe"
                        />
                    ) : (
                        <div className="loading-spinner" />
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

import { useRef } from "react";
import { motion } from "framer-motion";

export default function PagePreview({ page, editMode, onContentChange }) {
    const ref = useRef(null);

    if (!page) return null;

    const imagesHtml = (page.images || [])
        .map(
            (img) =>
                `<div style="text-align:center;margin:15px 0;">
          <img src="${img.url}" alt="${img.caption || ""}" style="max-width:80%;border-radius:6px;">
          ${img.caption ? `<p style="font-size:0.9em;color:#888;font-style:italic;margin-top:6px;">${img.caption}</p>` : ""}
        </div>`
        )
        .join("");

    const html = `<h2>${page.title || ""}</h2>${page.content || ""}${imagesHtml}`;

    const handleBlur = () => {
        if (!ref.current || !editMode) return;
        const clone = ref.current.cloneNode(true);
        const h2 = clone.querySelector("h2");
        if (h2) h2.remove();
        clone.querySelectorAll("[style*='text-align:center']").forEach((el) => el.remove());
        onContentChange(clone.innerHTML.trim());
    };

    return (
        <motion.div
            className="preview-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div
                ref={ref}
                className={`preview-content ${editMode ? "editing" : ""}`}
                contentEditable={editMode}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: html }}
                onBlur={handleBlur}
            />
        </motion.div>
    );
}

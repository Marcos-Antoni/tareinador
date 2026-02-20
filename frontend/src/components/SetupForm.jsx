import { useState, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
    User, CreditCard, BookOpen, Sparkles, Plus, Trash2,
    GripVertical, FileText, Building2, GraduationCap, Calendar
} from "lucide-react";

let idCounter = 0;
const makeId = () => ++idCounter;

export default function SetupForm({ onGenerate, disabled }) {
    const [form, setForm] = useState({
        // Datos universitarios
        universidad: "Universidad Mariano Gálvez de Guatemala",
        centro: "Centro Universitario de Santa Rosa",
        carrera: "Ingeniería en Sistemas",
        docente: "",
        materia: "",
        semestre: "",
        // Datos del estudiante
        author: "",
        carnet: "",
        sede: "",
        // Documento
        title: "",
        includeCaratula: true,
        includeIndice: true,
        sections: [],
    });

    const addSection = () => {
        setForm((prev) => ({
            ...prev,
            sections: [...prev.sections, { id: makeId(), name: "", description: "", pages: 1 }],
        }));
    };

    const removeSection = (id) => {
        setForm((prev) => ({
            ...prev,
            sections: prev.sections.filter((s) => s.id !== id),
        }));
    };

    const updateSection = (id, field, value) => {
        setForm((prev) => ({
            ...prev,
            sections: prev.sections.map((s) => s.id === id ? { ...s, [field]: value } : s),
        }));
    };

    const handleReorder = (newOrder) => {
        setForm((prev) => ({ ...prev, sections: newOrder }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validSections = form.sections.filter((s) => s.name.trim());
        if (validSections.length === 0) return;
        onGenerate({ ...form, sections: validSections.map(({ id, ...rest }) => rest) });
    };

    const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const totalPages = form.sections.reduce((sum, s) => sum + (parseInt(s.pages) || 1), 0)
        + (form.includeCaratula ? 1 : 0)
        + (form.includeIndice ? 1 : 0);

    return (
        <motion.form
            className="glass-card setup-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* ─── Datos universitarios ─── */}
            <div className="form-section-title"><Building2 size={15} /> Información Universitaria</div>

            <div className="form-row">
                <div className="form-group">
                    <label>Universidad</label>
                    <input type="text" value={form.universidad} onChange={update("universidad")}
                        placeholder="Ej: Universidad Mariano Gálvez de Guatemala" />
                </div>
                <div className="form-group">
                    <label>Centro Universitario</label>
                    <input type="text" value={form.centro} onChange={update("centro")}
                        placeholder="Ej: Centro Universitario de Santa Rosa" />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Carrera</label>
                    <input type="text" value={form.carrera} onChange={update("carrera")}
                        placeholder="Ej: Ingeniería en Sistemas" />
                </div>
                <div className="form-group">
                    <label>Docente <span className="optional-tag">opcional</span></label>
                    <input type="text" value={form.docente} onChange={update("docente")}
                        placeholder="Ej: Ing. Gilberto Argueta" />
                </div>
            </div>

            <div className="form-row form-row-3">
                <div className="form-group">
                    <label>Materia</label>
                    <input type="text" value={form.materia} onChange={update("materia")}
                        placeholder="Ej: Lógica" required />
                </div>
                <div className="form-group">
                    <label>Semestre</label>
                    <input type="text" value={form.semestre} onChange={update("semestre")}
                        placeholder="Ej: 1er. Semestre" />
                </div>
                <div className="form-group">
                    <label>Sede y fecha</label>
                    <input type="text" value={form.sede} onChange={update("sede")}
                        placeholder="Ej: Barberena, Santa Rosa" />
                </div>
            </div>

            {/* ─── Datos del estudiante ─── */}
            <div className="form-section-title"><GraduationCap size={15} /> Datos del Estudiante</div>

            <div className="form-row">
                <div className="form-group">
                    <label><User size={14} /> Nombre Completo</label>
                    <input type="text" value={form.author} onChange={update("author")}
                        placeholder="Ej: Marco Antonio Barrera González" required />
                </div>
                <div className="form-group">
                    <label><CreditCard size={14} /> Carné</label>
                    <input type="text" value={form.carnet} onChange={update("carnet")}
                        placeholder="Ej: 1590-21-18772" required />
                </div>
            </div>

            {/* ─── Documento ─── */}
            <div className="form-section-title"><BookOpen size={15} /> Documento</div>

            <div className="form-group">
                <label>Nombre del Trabajo</label>
                <input type="text" value={form.title} onChange={update("title")}
                    placeholder="Ej: Resumen del capítulo 1 del libro de lógica" required />
            </div>

            {/* Opciones automáticas */}
            <div className="form-group">
                <label>Páginas automáticas</label>
                <div className="auto-pages-row">
                    <label className={`toggle-chip ${form.includeCaratula ? "active" : ""}`}>
                        <input type="checkbox" checked={form.includeCaratula}
                            onChange={(e) => setForm((p) => ({ ...p, includeCaratula: e.target.checked }))} />
                        📋 Carátula
                    </label>
                    <label className={`toggle-chip ${form.includeIndice ? "active" : ""}`}>
                        <input type="checkbox" checked={form.includeIndice}
                            onChange={(e) => setForm((p) => ({ ...p, includeIndice: e.target.checked }))} />
                        📑 Índice
                    </label>
                </div>
            </div>

            {/* Secciones dinámicas */}
            <div className="form-group">
                <div className="sections-header">
                    <label><FileText size={14} /> Secciones del documento</label>
                    {form.sections.length > 0 && <span className="pages-badge">{totalPages} páginas estimadas</span>}
                </div>

                {form.sections.length === 0 ? (
                    <div className="empty-sections">
                        <p>No hay secciones todavía. Agrega las secciones que necesites.</p>
                    </div>
                ) : (
                    <Reorder.Group axis="y" values={form.sections} onReorder={handleReorder} className="sections-list">
                        {form.sections.map((sec) => (
                            <Reorder.Item key={sec.id} value={sec} className="section-card">
                                <div className="section-card-header">
                                    <div className="grip-handle" title="Arrastra para reordenar">
                                        <GripVertical size={14} />
                                    </div>
                                    <span className="section-number">{form.sections.indexOf(sec) + 1}</span>
                                    <input
                                        type="text"
                                        className="section-name-input"
                                        value={sec.name}
                                        onChange={(e) => updateSection(sec.id, "name", e.target.value)}
                                        placeholder="Nombre de la sección"
                                        required
                                    />
                                    <div className="pages-control">
                                        <button type="button" className="pages-btn" onClick={() => updateSection(sec.id, "pages", Math.max(1, (parseInt(sec.pages) || 1) - 1))}>−</button>
                                        <span className="pages-value">{sec.pages}</span>
                                        <button type="button" className="pages-btn" onClick={() => updateSection(sec.id, "pages", (parseInt(sec.pages) || 1) + 1)}>+</button>
                                        <span className="pages-unit">pág</span>
                                    </div>
                                    <button type="button" className="btn-icon-delete" onClick={() => removeSection(sec.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <textarea
                                    className="section-desc-input"
                                    value={sec.description}
                                    onChange={(e) => updateSection(sec.id, "description", e.target.value)}
                                    placeholder="¿Qué debe contener esta sección? Instrucciones para la IA..."
                                    rows={2}
                                />
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}

                <button type="button" className="btn btn-secondary btn-block add-section-btn" onClick={addSection}>
                    <Plus size={16} /> Agregar sección
                </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={disabled || form.sections.filter((s) => s.name.trim()).length === 0}>
                <Sparkles size={18} /> Generar con IA
            </button>
        </motion.form>
    );
}

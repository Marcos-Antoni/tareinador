import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDocument } from "./hooks/useDocument";
import Stepper from "./components/Stepper";
import SetupForm from "./components/SetupForm";
import PageEditor from "./components/PageEditor";
import FullPreview from "./components/FullPreview";
import LoadingOverlay from "./components/LoadingOverlay";
import Toast, { toast } from "./components/Toast";

const pageVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

export default function App() {
  const doc = useDocument();
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async (formData) => {
    const ok = await doc.generate(formData);
    if (ok) {
      toast("Documento generado exitosamente", "success");
      setStep(1);
    } else {
      toast(doc.error || "Error al generar", "error");
    }
  };

  const handleAIEdit = async (instructions) => {
    const ok = await doc.editWithAI(instructions);
    if (ok) toast("Página editada con IA", "success");
    else toast(doc.error || "Error al editar", "error");
  };

  const handleNavigate = (dir) => {
    const next = doc.currentPage + dir;
    if (next >= 0 && next < doc.totalPages) doc.setCurrentPage(next);
  };

  const handleDownload = async () => {
    await doc.download();
    toast("PDF descargado", "success");
    setStep(2);
  };

  const handleNewDoc = () => {
    setStep(0);
  };

  return (
    <div className="app-root">
      {/* Background */}
      <div className="bg-gradient" />
      <div className="bg-grid" />

      {/* Header */}
      <header className="app-header">
        <h1 className="logo">
          <span className="logo-icon">📄</span> El Tareinador
        </h1>
        <p className="header-subtitle">Generador de tareas con Inteligencia Artificial</p>
      </header>

      {/* Stepper */}
      <Stepper current={step} />

      {/* Views */}
      <main className="main-container">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="setup" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>
              <SetupForm onGenerate={handleGenerate} disabled={doc.loading} />
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="editor" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>
              <PageEditor
                document={doc.document}
                page={doc.page}
                currentPage={doc.currentPage}
                totalPages={doc.totalPages}
                onNavigate={handleNavigate}
                onAIEdit={handleAIEdit}
                onSaveContent={doc.savePageContent}
                onUploadImage={doc.addImage}
                onDeleteImage={doc.deleteImage}
                onDownload={handleDownload}
                onPreview={() => setShowPreview(true)}
                onNewDoc={handleNewDoc}
                disabled={doc.loading}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="done" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>
              <div className="glass-card done-card">
                <div className="done-icon">🎉</div>
                <h2>¡Documento descargado!</h2>
                <p>Tu tarea ha sido generada exitosamente. Puedes volver a editar o crear una nueva.</p>
                <div className="done-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>
                    Volver al editor
                  </button>
                  <button className="btn btn-primary" onClick={handleNewDoc}>
                    Crear nueva tarea
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FullPreview Overlay */}
      {showPreview && (
        <FullPreview
          docId={doc.docId}
          getPreview={doc.getPreview}
          onClose={() => setShowPreview(false)}
        />
      )}

      <LoadingOverlay visible={doc.loading} message={doc.loadingMsg} />
      <Toast />
    </div>
  );
}

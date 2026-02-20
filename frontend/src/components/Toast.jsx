import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
};

let showToastFn = null;

export function toast(message, type = "info") {
    if (showToastFn) showToastFn(message, type);
}

export default function Toast() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    useEffect(() => {
        showToastFn = addToast;
        return () => { showToastFn = null; };
    }, [addToast]);

    return (
        <div className="toast-container">
            <AnimatePresence>
                {toasts.map((t) => {
                    const Icon = icons[t.type] || Info;
                    return (
                        <motion.div
                            key={t.id}
                            className={`toast toast-${t.type}`}
                            initial={{ opacity: 0, y: 50, x: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ type: "spring", damping: 20 }}
                        >
                            <Icon size={18} />
                            <span>{t.message}</span>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

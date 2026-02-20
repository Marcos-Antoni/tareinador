import { motion } from "framer-motion";
import { FileText, Edit, Download } from "lucide-react";

const steps = [
    { label: "Configurar", icon: FileText },
    { label: "Editar", icon: Edit },
    { label: "Descargar", icon: Download },
];

export default function Stepper({ current }) {
    return (
        <div className="stepper">
            {steps.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === current;
                const isDone = i < current;
                return (
                    <div key={i} className="stepper-item-wrapper">
                        <motion.div
                            className={`stepper-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                            animate={{ scale: isActive ? 1.05 : 1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <div className="stepper-icon">
                                <Icon size={18} />
                            </div>
                            <span className="stepper-label">{step.label}</span>
                        </motion.div>
                        {i < steps.length - 1 && (
                            <div className={`stepper-line ${isDone ? "done" : ""}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
